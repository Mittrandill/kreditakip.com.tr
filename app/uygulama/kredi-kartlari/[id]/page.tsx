"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreVertical,
  Settings,
  Bell,
  Shield,
  Smartphone,
  Wifi,
  Edit,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Banknote,
  Calculator,
  Download,
  FileText,
  History,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getCreditCard } from "@/lib/api/credit-cards"
import { formatCurrency, formatPercent } from "@/lib/format"
import { toast } from "sonner"
import BankLogo from "@/components/bank-logo"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface CreditCardData {
  id: string
  user_id: string
  bank_id: string
  card_name: string
  card_type: "kredi" | "bankakarti" | "prepaid"
  card_number: string | null
  credit_limit: number
  current_debt: number
  available_limit: number
  minimum_payment_rate: number
  interest_rate: number
  late_payment_fee: number
  annual_fee: number
  statement_day: number | null
  due_day: number | null
  next_statement_date: string | null
  next_due_date: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  banks: {
    id: string
    name: string
    logo_url: string | null
  }
  bank_name?: string
}

// Mock data for charts
const spendingTrendData = [
  { month: "Oca", amount: 2400 },
  { month: "Şub", amount: 1398 },
  { month: "Mar", amount: 9800 },
  { month: "Nis", amount: 3908 },
  { month: "May", amount: 4800 },
  { month: "Haz", amount: 3800 },
]

const categoryData = [
  { name: "Market", value: 35, color: "#3b82f6" },
  { name: "Restoran", value: 25, color: "#ef4444" },
  { name: "Yakıt", value: 20, color: "#f59e0b" },
  { name: "Alışveriş", value: 15, color: "#10b981" },
  { name: "Diğer", value: 5, color: "#8b5cf6" },
]

export default function CreditCardDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [creditCard, setCreditCard] = useState<CreditCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("genel")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [limitIncreaseAmount, setLimitIncreaseAmount] = useState("")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [raporLoading, setRaporLoading] = useState(false)

  useEffect(() => {
    if (params.id && user?.id) {
      fetchCreditCard()
    }
  }, [params.id, user?.id])

  const fetchCreditCard = async () => {
    try {
      setLoading(true)
      const data = await getCreditCard(params.id as string)
      setCreditCard(data)
    } catch (error) {
      console.error("Error fetching credit card:", error)
      toast.error("Kredi kartı bilgileri yüklenirken hata oluştu")
      router.push("/uygulama/kredi-kartlari")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      toast.error("Geçerli bir tutar giriniz")
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Ödeme başarıyla gerçekleştirildi!")
      setIsPaymentModalOpen(false)
      setPaymentAmount("")
      fetchCreditCard()
    } catch (error) {
      toast.error("Ödeme işlemi sırasında hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLimitIncrease = async () => {
    if (!limitIncreaseAmount || isNaN(Number(limitIncreaseAmount))) {
      toast.error("Geçerli bir tutar giriniz")
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Limit artırım talebi başarıyla gönderildi!")
      setIsLimitModalOpen(false)
      setLimitIncreaseAmount("")
    } catch (error) {
      toast.error("Limit artırım talebi sırasında hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOdemeYap = () => {
    setIsPaymentModalOpen(true)
  }

  const handleHesapla = () => {
    toast.info("Hesaplama özelliği yakında eklenecek")
  }

  const handleRaporAl = async () => {
    setRaporLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      toast.success("Rapor başarıyla oluşturuldu!")
    } catch (error) {
      toast.error("Rapor oluşturulurken hata oluştu")
    } finally {
      setRaporLoading(false)
    }
  }

  const handleDuzenle = () => {
    router.push(`/uygulama/kredi-kartlari/duzenle/${creditCard?.id}`)
  }

  const getCardTypeColor = (cardType: string) => {
    switch (cardType) {
      case "kredi":
        return "bg-gradient-to-br from-purple-600 to-pink-600"
      case "bankakarti":
        return "bg-gradient-to-br from-blue-600 to-indigo-600"
      case "prepaid":
        return "bg-gradient-to-br from-green-600 to-emerald-600"
      default:
        return "bg-gradient-to-br from-gray-600 to-slate-600"
    }
  }

  const getCardTypeName = (cardType: string) => {
    switch (cardType) {
      case "kredi":
        return "Kredi Kartı"
      case "bankakarti":
        return "Banka Kartı"
      case "prepaid":
        return "Ön Ödemeli Kart"
      default:
        return "Bilinmeyen"
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return "text-red-600"
    if (utilization >= 60) return "text-yellow-600"
    return "text-green-600"
  }

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization >= 80) return "bg-red-100"
    if (utilization >= 60) return "bg-yellow-100"
    return "bg-green-100"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!creditCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kredi Kartı Bulunamadı</h2>
        <p className="text-gray-600 mb-4">Aradığınız kredi kartı mevcut değil.</p>
        <Button onClick={() => router.push("/uygulama/kredi-kartlari")}>Kredi Kartlarına Dön</Button>
      </div>
    )
  }

  const utilizationRate = creditCard.credit_limit > 0 ? (creditCard.current_debt / creditCard.credit_limit) * 100 : 0
  const minimumPayment = (creditCard.current_debt * creditCard.minimum_payment_rate) / 100

  // Mock dynamic stats for the hero section
  const dynamicStats = {
    remainingDebt: creditCard.current_debt,
    remainingInstallments: 12,
    paidInstallments: 8,
    paymentProgress: 66.7,
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <BankLogo
                  bankName={creditCard.banks?.name ?? creditCard.bank_name ?? "Bilinmeyen Banka"}
                  size="lg"
                  className="bg-white/20 p-2 rounded-lg"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Kredi Kartı Detayı</h1>
                  <p className="text-teal-100 text-lg">
                    {creditCard.banks?.name ?? creditCard.bank_name ?? "Bilinmeyen Banka"}
                  </p>
                  <p className="text-teal-200 text-sm">{creditCard.card_name}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-white text-white-800 hover:bg-gray-100 hover:text-white-900 font-semibold shadow-lg border border-white/20 backdrop-blur-sm gap-2"
                  >
                    <MoreVertical className="h-4 w-4" />
                    İşlemler
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleOdemeYap} className="gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    Ödeme Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHesapla} className="gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    Harcama Ekle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRaporAl} disabled={raporLoading} className="gap-2">
                    {raporLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    ) : (
                      <Download className="h-4 w-4 text-purple-600" />
                    )}
                    {raporLoading ? "Hazırlanıyor..." : "Rapor Al"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDuzenle} className="gap-2">
                    <Edit className="h-4 w-4 text-orange-600" />
                    Düzenle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Kredi Bilgileri Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Mevcut Borç</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(dynamicStats.remainingDebt)}</p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Min. Ödeme</p>
              <p className="text-2xl md:text-3xl font-bold">{formatCurrency(minimumPayment)}</p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Faiz Oranı</p>
              <p className="text-2xl md:text-3xl font-bold">{formatPercent(creditCard.interest_rate)}</p>
            </div>
            <div className="text-center">
              <p className="text-teal-100 text-sm mb-1">Kullanım Oranı</p>
              <p className="text-2xl md:text-3xl font-bold">{formatPercent(utilizationRate)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Limit Kullanımı</span>
              <span className="text-sm font-bold">
                {formatCurrency(creditCard.current_debt)}/{formatCurrency(creditCard.credit_limit)}
              </span>
            </div>
            <Progress value={utilizationRate} className="h-3 bg-white/20" />
            <p className="text-xs text-teal-100 mt-1">{formatPercent(utilizationRate)} kullanıldı</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 px-4 py-2 text-sm font-semibold shadow-lg">
              <CheckCircle className="mr-2 h-4 w-4" />
              {creditCard.is_active ? "Aktif" : "Pasif"}
            </Badge>
            <div className="text-right">
              <p className="text-teal-100 text-sm">
                Oluşturulma: {new Date(creditCard.created_at).toLocaleDateString("tr-TR")}
              </p>
              {creditCard.next_due_date && (
                <p className="text-teal-100 text-sm">
                  Sonraki Ödeme: {new Date(creditCard.next_due_date).toLocaleDateString("tr-TR")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50">
            <TabsList className="grid grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="genel"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Genel Bilgiler</span>
                <span className="sm:hidden font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="harcamalar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Harcamalar</span>
                <span className="sm:hidden font-medium">Harcama</span>
              </TabsTrigger>
              <TabsTrigger
                value="odemeler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ödemeler</span>
                <span className="sm:hidden font-medium">Ödeme</span>
              </TabsTrigger>
              <TabsTrigger
                value="grafikler"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Grafikler</span>
                <span className="sm:hidden font-medium">Grafik</span>
              </TabsTrigger>
              <TabsTrigger
                value="ayarlar"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ayarlar</span>
                <span className="sm:hidden font-medium">Ayar</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Genel Tab */}
            <TabsContent value="genel" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Credit Card Visual */}
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Kart Görseli</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div
                      className={`relative w-full h-48 rounded-2xl ${getCardTypeColor(creditCard.card_type)} p-6 text-white shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300`}
                    >
                      {/* Card Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white rounded-full"></div>
                        <div className="absolute top-6 right-6 w-8 h-8 border-2 border-white rounded-full"></div>
                      </div>

                      {/* Bank Logo */}
                      <div className="absolute top-4 left-4">
                        <BankLogo
                          bankName={creditCard.banks?.name ?? creditCard.bank_name ?? "Bilinmeyen Banka"}
                          size="sm"
                          className="bg-white/20 p-1 rounded"
                        />
                      </div>

                      {/* Contactless Payment Symbol */}
                      <div className="absolute top-4 right-4">
                        <Wifi className="h-6 w-6 rotate-90" />
                      </div>

                      {/* Card Number */}
                      <div className="absolute bottom-16 left-4">
                        <p className="text-lg font-mono tracking-wider">
                          {creditCard.card_number
                            ? `**** **** **** ${creditCard.card_number.slice(-4)}`
                            : "**** **** **** ****"}
                        </p>
                      </div>

                      {/* Card Holder & Expiry */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                        <div>
                          <p className="text-xs opacity-80">KART SAHİBİ</p>
                          <p className="text-sm font-semibold">
                            {user?.email?.split("@")[0]?.toUpperCase() || "KART SAHİBİ"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-80">GEÇERLİLİK</p>
                          <p className="text-sm font-semibold">12/28</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Details */}
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Kart Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Kart Türü</Label>
                        <p className="font-semibold">{getCardTypeName(creditCard.card_type)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Durum</Label>
                        <Badge variant={creditCard.is_active ? "default" : "secondary"} className="ml-2">
                          {creditCard.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Faiz Oranı</Label>
                        <p className="font-semibold">%{creditCard.interest_rate}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Gecikme Ücreti</Label>
                        <p className="font-semibold">{formatCurrency(creditCard.late_payment_fee)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Yıllık Aidat</Label>
                        <p className="font-semibold">{formatCurrency(creditCard.annual_fee)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Min. Ödeme Oranı</Label>
                        <p className="font-semibold">%{creditCard.minimum_payment_rate}</p>
                      </div>
                    </div>

                    {creditCard.next_due_date && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Sonraki Ödeme Tarihi: {new Date(creditCard.next_due_date).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    )}

                    {creditCard.notes && (
                      <div className="mt-4">
                        <Label className="text-sm text-gray-600">Notlar</Label>
                        <p className="text-sm text-gray-800 mt-1">{creditCard.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Limit</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(creditCard.credit_limit)}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Mevcut Borç</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(creditCard.current_debt)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Kullanılabilir</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(creditCard.available_limit)}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Kullanım Oranı</p>
                      <p className={`text-2xl font-bold ${getUtilizationColor(utilizationRate)}`}>
                        {utilizationRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className={`p-3 ${getUtilizationBgColor(utilizationRate)} rounded-full`}>
                      <TrendingUp className={`h-6 w-6 ${getUtilizationColor(utilizationRate)}`} />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Harcamalar Tab */}
            <TabsContent value="harcamalar" className="space-y-6 mt-0">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Harcama Geçmişi</CardTitle>
                  <CardDescription>Son harcamalarınızı buradan takip edebilirsiniz</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Harcama Yok</h3>
                    <p className="text-gray-600">Harcamalarınız burada görünecek</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ödemeler Tab */}
            <TabsContent value="odemeler" className="space-y-6 mt-0">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Ödeme Geçmişi</CardTitle>
                  <CardDescription>Kredi kartı ödemelerinizi buradan takip edebilirsiniz</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Ödeme Yok</h3>
                    <p className="text-gray-600">Ödemeleriniz burada görünecek</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grafikler Tab */}
            <TabsContent value="grafikler" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Harcama Trendi</CardTitle>
                    <CardDescription>Aylık harcama değişiminiz</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={spendingTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Harcama"]} />
                        <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Kategori Dağılımı</CardTitle>
                    <CardDescription>Harcamalarınızın kategori bazında dağılımı</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Ayarlar Tab */}
            <TabsContent value="ayarlar" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Bildirim Ayarları
                    </CardTitle>
                    <CardDescription>Kredi kartı bildirimleri için tercihlerinizi ayarlayın</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Ödeme Hatırlatması</Label>
                        <p className="text-xs text-gray-600">Ödeme tarihi yaklaştığında bildirim al</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Harcama Bildirimi</Label>
                        <p className="text-xs text-gray-600">Her harcamada anlık bildirim al</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Limit Uyarısı</Label>
                        <p className="text-xs text-gray-600">Limit %80'e ulaştığında uyar</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Hızlı İşlemler
                    </CardTitle>
                    <CardDescription>Sık kullanılan işlemler için kısayollar</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Ödeme Yap
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setIsLimitModalOpen(true)}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Limit Artırım Talebi
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Shield className="mr-2 h-4 w-4" />
                      Kart Dondur/Aktifleştir
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Dijital Kart Oluştur
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kredi Kartı Ödemesi</DialogTitle>
            <DialogDescription>{creditCard.card_name} için ödeme yapın</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Ödeme Tutarı</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPaymentAmount(minimumPayment.toString())}>
                Min. Ödeme ({formatCurrency(minimumPayment)})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPaymentAmount(creditCard.current_debt.toString())}>
                Tüm Borç ({formatCurrency(creditCard.current_debt)})
              </Button>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">
                İptal
              </Button>
              <Button onClick={handlePayment} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  "Ödeme Yap"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Limit Increase Modal */}
      <Dialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Limit Artırım Talebi</DialogTitle>
            <DialogDescription>Mevcut limitiniz: {formatCurrency(creditCard.credit_limit)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit-amount">Talep Edilen Limit</Label>
              <Input
                id="limit-amount"
                type="number"
                step="1000"
                placeholder="0"
                value={limitIncreaseAmount}
                onChange={(e) => setLimitIncreaseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit-reason">Talep Nedeni (Opsiyonel)</Label>
              <Textarea
                id="limit-reason"
                placeholder="Limit artırım talebinizin nedenini belirtebilirsiniz..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsLimitModalOpen(false)} className="flex-1">
                İptal
              </Button>
              <Button onClick={handleLimitIncrease} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  "Talep Gönder"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
