"use client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { formatCurrency, formatPercent } from "@/lib/format"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  PieChartIcon,
  DollarSign,
  Target,
  AlertTriangle,
  Share2,
  Download,
  Calendar,
  Building2,
  CreditCard,
  Percent,
  Banknote,
  TrendingDown,
} from "lucide-react"

interface Credit {
  id: string
  bank_name: string
  credit_type: string
  amount: number
  interest_rate: number
  term: number
  monthly_payment: number
  remaining_balance: number
  start_date: string
}

export default function RaporlarPage() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("genel")

  useEffect(() => {
    if (user?.id) {
      loadCredits()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadCredits = async () => {
    if (!user?.id) {
      console.log("User not found, skipping credits load")
      setLoading(false)
      return
    }

    try {
      const data = await getCredits(user.id)
      setCredits(data)
    } catch (error) {
      console.error("Krediler yüklenirken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  // Hesaplamalar
  const totalAmount = credits.reduce((sum, credit) => sum + credit.amount, 0)
  const totalRemainingBalance = credits.reduce((sum, credit) => sum + credit.remaining_balance, 0)
  const totalMonthlyPayment = credits.reduce((sum, credit) => sum + credit.monthly_payment, 0)
  const averageInterestRate =
    credits.length > 0 ? credits.reduce((sum, credit) => sum + (credit.interest_rate || 0), 0) / credits.length : 0

  const totalPaidAmount = totalAmount - totalRemainingBalance
  const savingsPotential = totalMonthlyPayment * 0.15

  // Grafik verileri
  const performanceData = [
    {
      month: "Oca",
      anaParaBorcu: Math.round(totalRemainingBalance * 1.2),
      toplamOdenen: Math.round(totalPaidAmount * 0.6),
    },
    {
      month: "Şub",
      anaParaBorcu: Math.round(totalRemainingBalance * 1.15),
      toplamOdenen: Math.round(totalPaidAmount * 0.7),
    },
    {
      month: "Mar",
      anaParaBorcu: Math.round(totalRemainingBalance * 1.1),
      toplamOdenen: Math.round(totalPaidAmount * 0.8),
    },
    {
      month: "Nis",
      anaParaBorcu: Math.round(totalRemainingBalance * 1.05),
      toplamOdenen: Math.round(totalPaidAmount * 0.9),
    },
    { month: "May", anaParaBorcu: Math.round(totalRemainingBalance), toplamOdenen: Math.round(totalPaidAmount) },
    {
      month: "Haz",
      anaParaBorcu: Math.round(totalRemainingBalance * 0.95),
      toplamOdenen: Math.round(totalPaidAmount * 1.1),
    },
  ]

  const monthlyPaymentData = [
    {
      name: "Tem",
      odeme: Math.round(totalMonthlyPayment * 1.1),
      anaPara: Math.round(totalMonthlyPayment * 0.7),
      faiz: Math.round(totalMonthlyPayment * 0.4),
    },
    {
      name: "Ağu",
      odeme: Math.round(totalMonthlyPayment * 1.05),
      anaPara: Math.round(totalMonthlyPayment * 0.72),
      faiz: Math.round(totalMonthlyPayment * 0.33),
    },
    {
      name: "Eyl",
      odeme: Math.round(totalMonthlyPayment),
      anaPara: Math.round(totalMonthlyPayment * 0.75),
      faiz: Math.round(totalMonthlyPayment * 0.25),
    },
    {
      name: "Eki",
      odeme: Math.round(totalMonthlyPayment * 0.95),
      anaPara: Math.round(totalMonthlyPayment * 0.77),
      faiz: Math.round(totalMonthlyPayment * 0.18),
    },
    {
      name: "Kas",
      odeme: Math.round(totalMonthlyPayment * 0.9),
      anaPara: Math.round(totalMonthlyPayment * 0.8),
      faiz: Math.round(totalMonthlyPayment * 0.1),
    },
    {
      name: "Ara",
      odeme: Math.round(totalMonthlyPayment * 0.85),
      anaPara: Math.round(totalMonthlyPayment * 0.82),
      faiz: Math.round(totalMonthlyPayment * 0.03),
    },
  ]

  const bankDistributionData = credits.reduce(
    (acc, credit) => {
      const existing = acc.find((item) => item.name === credit.bank_name)
      if (existing) {
        existing.value += credit.remaining_balance
      } else {
        acc.push({
          name: credit.bank_name,
          value: credit.remaining_balance,
        })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  const creditTypeData = credits.reduce(
    (acc, credit) => {
      const existing = acc.find((item) => item.name === credit.credit_type)
      if (existing) {
        existing.value += credit.remaining_balance
      } else {
        acc.push({
          name: credit.credit_type,
          value: credit.remaining_balance,
        })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  const COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"]

  const riskScore = Math.min(10, Math.max(1, (averageInterestRate / 5) * 10))
  const performanceScore = totalAmount > 0 ? Math.min(100, Math.max(0, (totalPaidAmount / totalAmount) * 100)) : 0

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Raporlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (credits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-8 bg-gray-50 rounded-2xl">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz kredi bulunmuyor</h3>
          <p className="text-gray-600 mb-6">Rapor oluşturmak için önce kredi eklemeniz gerekiyor.</p>
          <Button onClick={() => (window.location.href = "/uygulama/krediler/kredi-ekle")}>
            İlk Kredinizi Ekleyin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-violet-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Finansal Analiz ve Raporlama
              </h2>
              <p className="text-purple-100 text-lg">
                Detaylı finansal analizler, performans raporları ve tasarruf önerilerinizi keşfedin
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Download className="h-5 w-5" />
                PDF İndir
              </Button>
              <Button variant="outline" size="lg" className="bg-white text-purple-600 hover:bg-purple-50 border-white">
                <Share2 className="h-5 w-5" />
                Rapor Paylaş
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Analiz"
          value={credits.length.toString()}
          subtitle="Aktif kredi sayısı"
          color="blue"
          icon={<BarChart3 />}
        />
        <MetricCard
          title="Tasarruf Potansiyeli"
          value={formatCurrency(savingsPotential)}
          subtitle="Aylık tasarruf"
          color="emerald"
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Risk Skoru"
          value={`${riskScore.toFixed(1)}/10`}
          subtitle={riskScore > 7 ? "Yüksek risk" : riskScore > 4 ? "Orta risk" : "Düşük risk"}
          color={riskScore > 7 ? "red" : riskScore > 4 ? "orange" : "emerald"}
          icon={<AlertTriangle />}
        />
        <MetricCard
          title="Performans"
          value={`${performanceScore.toFixed(0)}%`}
          subtitle="Ödeme başarı oranı"
          color="purple"
          icon={<Target />}
        />
      </div>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-6 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="genel"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="performans"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Performans</span>
              </TabsTrigger>
              <TabsTrigger
                value="risk"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Risk</span>
              </TabsTrigger>
              <TabsTrigger
                value="tasarruf"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Tasarruf</span>
              </TabsTrigger>
              <TabsTrigger
                value="bankalar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Bankalar</span>
              </TabsTrigger>
              <TabsTrigger
                value="tahmin"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Tahmin</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="genel" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-emerald-600" />
                      Borç Azalış Trendi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        anaParaBorcu: {
                          label: "Ana Para Borcu",
                          color: "hsl(174, 72%, 40%)",
                        },
                        toplamOdenen: {
                          label: "Toplam Ödenen",
                          color: "hsl(174, 65%, 56%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                          <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="anaParaBorcu"
                            stroke="var(--color-anaParaBorcu)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-anaParaBorcu)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "var(--color-anaParaBorcu)", strokeWidth: 2 }}
                            name="Ana Para Borcu"
                          />
                          <Line
                            type="monotone"
                            dataKey="toplamOdenen"
                            stroke="var(--color-toplamOdenen)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-toplamOdenen)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "var(--color-toplamOdenen)", strokeWidth: 2 }}
                            name="Toplam Ödenen"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-emerald-600" />
                      Banka Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bankDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {bankDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          />
                          <Legend verticalAlign="bottom" height={36} formatter={(value) => value} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performans" className="mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      Aylık Ödeme Performansı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        anaParaBorcu: {
                          label: "Ana Para Borcu",
                          color: "hsl(174, 72%, 40%)",
                        },
                        toplamOdenen: {
                          label: "Toplam Ödenen",
                          color: "hsl(174, 65%, 56%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                          <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="anaParaBorcu"
                            stroke="var(--color-anaParaBorcu)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-anaParaBorcu)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "var(--color-anaParaBorcu)", strokeWidth: 2 }}
                            name="Ana Para Borcu"
                          />
                          <Line
                            type="monotone"
                            dataKey="toplamOdenen"
                            stroke="var(--color-toplamOdenen)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-toplamOdenen)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "var(--color-toplamOdenen)", strokeWidth: 2 }}
                            name="Toplam Ödenen"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-md transition-all duration-200 border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <Calendar className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 font-medium mb-1">Zamanında Ödeme Oranı</p>
                          <p className="text-2xl font-bold text-gray-900">{performanceScore.toFixed(0)}%</p>
                          <p className="text-xs text-emerald-600 font-medium">Mükemmel performans</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-all duration-200 border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Banknote className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 font-medium mb-1">Toplam Ödenen Tutar</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaidAmount)}</p>
                          <p className="text-xs text-blue-600 font-medium">
                            {((totalPaidAmount / totalAmount) * 100).toFixed(1)}% tamamlandı
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-all duration-200 border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <Percent className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 font-medium mb-1">Ortalama Faiz Oranı</p>
                          <p className="text-2xl font-bold text-gray-900">{formatPercent(averageInterestRate)}</p>
                          <p className="text-xs text-purple-600 font-medium">
                            {averageInterestRate > 2.5 ? "Piyasa ortalaması üzerinde" : "Rekabetçi oran"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Risk Değerlendirmesi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Genel Risk Skoru</span>
                          <span className="font-bold text-lg">{riskScore.toFixed(1)}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-1000 ease-out ${riskScore > 7 ? "bg-red-500" : riskScore > 4 ? "bg-orange-500" : "bg-emerald-500"}`}
                            style={{ width: `${(riskScore / 10) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {riskScore > 7 &&
                            "Yüksek faiz oranları nedeniyle risk seviyeniz yüksek. Refinansman düşünebilirsiniz."}
                          {riskScore > 4 &&
                            riskScore <= 7 &&
                            "Orta seviye risk. Ödeme planınızı gözden geçirmenizi öneririz."}
                          {riskScore <= 4 && "Düşük risk seviyesi. Finansal durumunuz iyi görünüyor."}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        Kredi Türü Dağılımı
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={creditTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="#fff"
                              strokeWidth={2}
                            >
                              {creditTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value, name) => [formatCurrency(Number(value)), name]}
                            />
                            <Legend verticalAlign="bottom" height={36} formatter={(value) => value} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasarruf" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg mt-1">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Erken Ödeme Stratejisi</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Aylık {formatCurrency(totalMonthlyPayment * 0.1)} ek ödeme yaparak yıllık{" "}
                            {formatCurrency(savingsPotential * 12)} tasarruf sağlayabilirsiniz.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Önerilen strateji
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg mt-1">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Refinansman Fırsatı</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Mevcut faiz oranlarınız piyasa ortalamasının üzerinde. Refinansman ile aylık{" "}
                            {formatCurrency(savingsPotential)} tasarruf mümkün.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Araştırılması önerilen
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg mt-1">
                          <Target className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Borç Konsolidasyonu</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Birden fazla kredinizi tek bir kredide toplayarak yönetimi kolaylaştırabilir ve faiz
                            tasarrufu sağlayabilirsiniz.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Uzun vadeli strateji
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Aylık Ödeme Optimizasyonu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        anaPara: {
                          label: "Ana Para",
                          color: "hsl(174, 72%, 40%)",
                        },
                        faiz: {
                          label: "Faiz",
                          color: "hsl(174, 65%, 56%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyPaymentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          />
                          <Legend />
                          <Bar
                            dataKey="anaPara"
                            stackId="a"
                            fill="var(--color-anaPara)"
                            name="Ana Para"
                            radius={[0, 0, 4, 4]}
                          />
                          <Bar dataKey="faiz" stackId="a" fill="var(--color-faiz)" name="Faiz" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bankalar" className="mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                      Banka Bazlı Analiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bankDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {bankDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          />
                          <Legend verticalAlign="bottom" height={36} formatter={(value) => value} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {credits.map((credit) => (
                    <Card key={credit.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{credit.bank_name}</h4>
                            <span className="text-sm text-gray-500">{credit.credit_type}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Kalan Borç:</span>
                              <span className="font-medium">{formatCurrency(credit.remaining_balance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Faiz Oranı:</span>
                              <span className="font-medium">{formatPercent(credit.interest_rate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Aylık Ödeme:</span>
                              <span className="font-medium">{formatCurrency(credit.monthly_payment)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tahmin" className="mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      Gelecek Tahminleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        anaParaBorcu: {
                          label: "Ana Para Borcu",
                          color: "hsl(174, 72%, 40%)",
                        },
                        toplamOdenen: {
                          label: "Toplam Ödenen",
                          color: "hsl(174, 65%, 56%)",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                          <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="anaParaBorcu"
                            stroke="var(--color-anaParaBorcu)"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ fill: "var(--color-anaParaBorcu)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "var(--color-anaParaBorcu)", strokeWidth: 2 }}
                            name="Ana Para Borcu (Tahmin)"
                          />
                          <Line
                            type="monotone"
                            dataKey="toplamOdenen"
                            stroke="var(--color-toplamOdenen)"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ fill: "var(--color-toplamOdenen)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: "var(--color-toplamOdenen)", strokeWidth: 2 }}
                            name="Toplam Ödenen (Tahmin)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="hover:shadow-md transition-all duration-200 border border-gray-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">6 Aylık Projeksiyon</CardTitle>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Mevcut ödeme planınıza göre 6 ay sonraki durumunuz</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Tahmini Kalan Borç</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(totalRemainingBalance * 0.7)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Toplam Ödenecek</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(totalMonthlyPayment * 6)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Faiz Ödemesi</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(totalMonthlyPayment * 6 * 0.3)}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <strong>Öngörü:</strong> Mevcut ödeme planınızla 6 ayda borcunuzun %30'unu ödeyeceksiniz.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-all duration-200 border border-gray-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">12 Aylık Projeksiyon</CardTitle>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Bir yıl sonunda ulaşacağınız finansal durum</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Tahmini Kalan Borç</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(totalRemainingBalance * 0.4)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Toplam Ödenecek</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(totalMonthlyPayment * 12)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Faiz Ödemesi</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(totalMonthlyPayment * 12 * 0.25)}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <strong>Hedef:</strong> 12 ayda borcunuzun %60'ını kapatarak finansal özgürlüğe
                          yaklaşacaksınız.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
