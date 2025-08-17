"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Download,
  FileText,
  Settings,
  BarChart3,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Eye,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { generatePDFReport } from "@/lib/utils/pdf-generator"
import { useToast } from "@/hooks/use-toast"

interface PDFReportModalProps {
  userData: {
    credits: any[]
    payments: any[]
    creditCards: any[]
    summary: {
      name: string
      email: string
    }
  }
  trigger?: React.ReactNode
}

const WIZARD_STEPS = [
  { id: "basic", title: "Rapor Ayarları", icon: Settings, description: "Temel rapor bilgileri" },
  { id: "content", title: "Kredi Seçimi", icon: CreditCard, description: "Dahil edilecek krediler" },
  { id: "charts", title: "Grafik & Analiz", icon: BarChart3, description: "Görsel raporlar" },
  { id: "preview", title: "Önizleme", icon: Eye, description: "Son kontrol ve oluştur" },
]

export default function PDFReportModal({ userData, trigger }: PDFReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { toast } = useToast()

  // Form state
  const [reportTitle, setReportTitle] = useState("Kredi Portföy Raporu")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [reportPeriod, setReportPeriod] = useState("last6Months")

  // Credit selection
  const [selectedCredits, setSelectedCredits] = useState<string[]>([])
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    creditDetails: true,
    paymentSchedule: true,
    interestAnalysis: true,
    riskAssessment: false,
  })

  // Chart options
  const [chartOptions, setChartOptions] = useState({
    paymentTrend: true,
    debtDistribution: true,
    bankComparison: true,
    interestComparison: true,
    paymentProgress: true,
  })

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period)
    const now = new Date()

    switch (period) {
      case "thisMonth":
        setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1))
        setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0))
        break
      case "last3Months":
        setDateFrom(new Date(now.getFullYear(), now.getMonth() - 3, 1))
        setDateTo(now)
        break
      case "last6Months":
        setDateFrom(new Date(now.getFullYear(), now.getMonth() - 6, 1))
        setDateTo(now)
        break
      case "thisYear":
        setDateFrom(new Date(now.getFullYear(), 0, 1))
        setDateTo(now)
        break
      case "custom":
        break
    }
  }

  const handleCreditToggle = (creditId: string, checked: boolean) => {
    setSelectedCredits((prev) => (checked ? [...prev, creditId] : prev.filter((id) => id !== creditId)))
  }

  const handleSectionToggle = (section: string, checked: boolean) => {
    setIncludeSections((prev) => ({ ...prev, [section]: checked }))
  }

  const handleChartToggle = (chart: string, checked: boolean) => {
    setChartOptions((prev) => ({ ...prev, [chart]: checked }))
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)

    try {
      // Safely get credits array
      const creditsArray = userData.credits || []

      // Filter selected credits
      const filteredCredits =
        selectedCredits.length === 0
          ? creditsArray
          : creditsArray.filter((credit) => selectedCredits.includes(credit.id))

      // Calculate summary metrics safely
      const totalCredits = filteredCredits.length
      const activeCredits = filteredCredits.filter((c) => c.status === "active").length
      const closedCredits = totalCredits - activeCredits
      const totalDebt = filteredCredits.reduce((sum, c) => sum + (c.remainingDebt || c.remaining_debt || 0), 0)
      const totalPayment = filteredCredits.reduce((sum, c) => sum + (c.amount || c.initial_amount || 0), 0)
      const monthlyPayment = filteredCredits
        .filter((c) => c.status === "active")
        .reduce((sum, c) => sum + (c.monthlyPayment || c.monthly_payment || 0), 0)

      // Prepare chart data
      const chartData: any = {}

      if (chartOptions.paymentTrend && userData.payments) {
        const monthlyData = userData.payments
          .filter((payment) => payment.status === "paid")
          .map((payment) => ({
            month: payment.date ? format(new Date(payment.date), "MMMM", { locale: tr }) : "",
            amount: payment.amount || 0,
            bank: payment.bankName || "",
            type: "payment",
          }))
        chartData.monthlyPayments = monthlyData
      }

      if (chartOptions.debtDistribution) {
        const distributionData = filteredCredits.reduce((acc: any[], credit) => {
          const bankName = credit.bankName || credit.banks?.name || "Bilinmeyen Banka"
          const existing = acc.find((item) => item.name === bankName)
          const debtAmount = credit.remainingDebt || credit.remaining_debt || 0

          if (existing) {
            existing.value += debtAmount
            existing.count += 1
          } else {
            acc.push({
              name: bankName,
              value: debtAmount,
              count: 1,
            })
          }
          return acc
        }, [])
        chartData.creditDistribution = distributionData
      }

      if (chartOptions.interestComparison) {
        const interestData = filteredCredits.map((credit) => ({
          bank: credit.bankName || credit.banks?.name || "Bilinmeyen",
          creditType: credit.creditType || credit.credit_types?.name || "Diğer",
          rate: credit.interestRate || credit.interest_rate || 0,
          amount: credit.remainingDebt || credit.remaining_debt || 0,
          monthlyInterest:
            ((credit.remainingDebt || credit.remaining_debt || 0) *
              (credit.interestRate || credit.interest_rate || 0)) /
            1200,
        }))
        chartData.interestAnalysis = interestData
      }

      // Bank distribution for charts
      if (chartOptions.bankComparison) {
        const bankData = filteredCredits.reduce((acc: any[], credit) => {
          const bankName = credit.bankName || credit.banks?.name || "Bilinmeyen Banka"
          const existing = acc.find((item) => item.bank === bankName)
          const debtAmount = credit.remainingDebt || credit.remaining_debt || 0

          if (existing) {
            existing.amount += debtAmount
          } else {
            acc.push({
              bank: bankName,
              amount: debtAmount,
            })
          }
          return acc
        }, [])
        chartData.bankDistribution = bankData
      }

      // Generate PDF report data with safe defaults
      const reportData = {
        reportTitle,
        period: {
          from: dateFrom,
          to: dateTo,
          type: reportPeriod,
        },
        userData: {
          name: userData.summary?.name || "Kullanıcı",
          email: userData.summary?.email || "email@example.com",
        },
        totalCredits,
        activeCredits,
        closedCredits,
        totalDebt,
        totalPayment,
        monthlyPayment,
        credits: filteredCredits.map((credit) => ({
          id: credit.id,
          bankName: credit.bankName || credit.banks?.name || "Bilinmeyen Banka",
          creditType: credit.creditType || credit.credit_types?.name || "Diğer",
          remainingDebt: credit.remainingDebt || credit.remaining_debt || 0,
          monthlyPayment: credit.monthlyPayment || credit.monthly_payment || 0,
          interestRate: credit.interestRate || credit.interest_rate || 0,
          status: credit.status || "unknown",
          amount: credit.amount || credit.initial_amount || 0,
        })),
        selectedReports: Object.keys(chartOptions).filter((key) => chartOptions[key as keyof typeof chartOptions]),
        chartData,
        selectedBanks: [...new Set(filteredCredits.map((c) => c.bankName || c.banks?.name).filter(Boolean))],
      }

      generatePDFReport(reportData)

      toast({
        title: "✅ Rapor Hazırlandı",
        description: "Kredi portföy raporunuz başarıyla oluşturuldu ve indirildi.",
      })

      setIsOpen(false)
      resetModal()
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        variant: "destructive",
        title: "❌ Hata Oluştu",
        description: "Rapor oluşturulurken bir sorun yaşandı. Lütfen tekrar deneyin.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedSectionsCount = Object.values(includeSections).filter(Boolean).length
  const selectedChartsCount = Object.values(chartOptions).filter(Boolean).length

  // Extract unique banks from user data
  const availableBanks = useMemo(() => {
    const banks = new Set<string>()
    userData.credits?.forEach((credit) => {
      const bankName = credit.bankName || credit.banks?.name
      if (bankName) banks.add(bankName)
    })
    return Array.from(banks).sort()
  }, [userData])

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const resetModal = () => {
    setCurrentStep(0)
    setReportTitle("Kredi Portföy Raporu")
    setDateFrom(undefined)
    setDateTo(new Date())
    setReportPeriod("last6Months")
    setSelectedCredits([])
    setIncludeSections({
      summary: true,
      creditDetails: true,
      paymentSchedule: true,
      interestAnalysis: true,
      riskAssessment: false,
    })
    setChartOptions({
      paymentTrend: true,
      debtDistribution: true,
      bankComparison: true,
      interestComparison: true,
      paymentProgress: true,
    })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return reportTitle.trim() !== ""
      case 1:
        return selectedCredits.length > 0 || (userData.credits?.length || 0) === 0
      case 2:
        return selectedChartsCount > 0 || !includeSections.summary
      default:
        return true
    }
  }

  // Safe calculations for display
  const creditsArray = userData.credits || []
  const totalCreditsCount = creditsArray.length
  const totalDebtAmount = creditsArray.reduce((sum, c) => sum + (c.remainingDebt || c.remaining_debt || 0), 0)
  const totalMonthlyPayment = creditsArray
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (c.monthlyPayment || c.monthly_payment || 0), 0)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetModal()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            PDF Rapor İndir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <div>Kredi Portföy Raporu</div>
              <div className="text-sm font-normal text-gray-500 mt-1">Profesyonel PDF raporu oluşturun</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Modern Progress Steps */}
        <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div key={step.id} className="flex items-center min-w-0">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => goToStep(index)}
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                      isActive &&
                        "bg-gradient-to-r from-emerald-600 to-teal-600 text-white scale-110 shadow-emerald-200",
                      isCompleted && "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200",
                      !isActive && !isCompleted && "bg-white text-gray-400 hover:bg-gray-50 shadow-gray-200",
                    )}
                  >
                    {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </button>
                  <div className="mt-3 text-center">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isActive && "text-emerald-600",
                        isCompleted && "text-green-600",
                        !isActive && !isCompleted && "text-gray-400",
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-20 h-1 mx-6 mt-7 rounded-full transition-all duration-300",
                      isCompleted ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-200",
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[450px] mb-8">
          {/* Step 1: Basic Settings */}
          {currentStep === 0 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-6 w-6" />
                  Rapor Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div>
                  <Label htmlFor="reportTitle" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Rapor Başlığı
                  </Label>
                  <Input
                    id="reportTitle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Rapor başlığını girin"
                    className="h-12 text-lg border-2 border-gray-200 focus:border-emerald-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Rapor Dönemi</Label>
                  <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">Bu Ay</SelectItem>
                      <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                      <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                      <SelectItem value="thisYear">Bu Yıl</SelectItem>
                      <SelectItem value="custom">Özel Tarih Aralığı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Başlangıç Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 border-2 border-gray-200 rounded-xl",
                              !dateFrom && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: tr }) : "Tarih seçin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus locale={tr} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Bitiş Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 border-2 border-gray-200 rounded-xl",
                              !dateTo && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: tr }) : "Tarih seçin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus locale={tr} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Credit Selection */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6" />
                  Kredi Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700">Rapora Dahil Edilecek Krediler</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedCredits.length === creditsArray.length) {
                          setSelectedCredits([])
                        } else {
                          setSelectedCredits(creditsArray.map((c) => c.id))
                        }
                      }}
                      className="rounded-xl"
                    >
                      {selectedCredits.length === creditsArray.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
                    </Button>
                  </div>

                  <div className="grid gap-4 max-h-80 overflow-y-auto">
                    {creditsArray.map((credit) => (
                      <div
                        key={credit.id}
                        className="flex items-center space-x-4 p-4 border-2 border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all"
                      >
                        <Checkbox
                          id={credit.id}
                          checked={selectedCredits.includes(credit.id)}
                          onCheckedChange={(checked) => handleCreditToggle(credit.id, checked as boolean)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <Label htmlFor={credit.id} className="cursor-pointer font-semibold text-gray-900">
                            {credit.bankName || credit.banks?.name || "Bilinmeyen Banka"} -{" "}
                            {credit.creditType || credit.credit_types?.name || "Diğer"}
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Kalan Borç: ₺{(credit.remainingDebt || credit.remaining_debt || 0).toLocaleString("tr-TR")}{" "}
                            | Aylık Ödeme: ₺
                            {(credit.monthlyPayment || credit.monthly_payment || 0).toLocaleString("tr-TR")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {creditsArray.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Henüz kredi kaydı bulunmuyor.</p>
                        <p className="text-sm">Önce kredi ekleyerek başlayın.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">Rapor İçeriği</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(includeSections).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-200"
                        >
                          <Checkbox
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) => handleSectionToggle(key, checked as boolean)}
                            className="w-5 h-5"
                          />
                          <Label htmlFor={key} className="cursor-pointer font-medium">
                            {key === "summary" && "Genel Özet"}
                            {key === "creditDetails" && "Kredi Detayları"}
                            {key === "paymentSchedule" && "Ödeme Planı"}
                            {key === "interestAnalysis" && "Faiz Analizi"}
                            {key === "riskAssessment" && "Risk Değerlendirmesi"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Charts Selection */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6" />
                  Grafik & Analiz Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(chartOptions).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start space-x-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all"
                    >
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleChartToggle(key, checked as boolean)}
                        className="w-5 h-5 mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={key} className="cursor-pointer font-semibold text-gray-900 block mb-2">
                          {key === "paymentTrend" && "📈 Ödeme Trendi"}
                          {key === "debtDistribution" && "🏦 Borç Dağılımı"}
                          {key === "bankComparison" && "⚖️ Banka Karşılaştırması"}
                          {key === "interestComparison" && "📊 Faiz Karşılaştırması"}
                          {key === "paymentProgress" && "📅 Ödeme İlerlemesi"}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {key === "paymentTrend" && "Aylık ödeme miktarlarının trend analizi"}
                          {key === "debtDistribution" && "Bankalara göre borç dağılım grafiği"}
                          {key === "bankComparison" && "Bankalar arası detaylı karşılaştırma"}
                          {key === "interestComparison" && "Faiz oranları ve maliyet analizi"}
                          {key === "paymentProgress" && "Ödeme ilerleme durumu takibi"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-6 w-6" />
                  Rapor Önizlemesi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="h-6 w-6 text-indigo-600" />
                      <h4 className="font-bold text-xl text-indigo-800">📊 Rapor Özeti</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <div>
                          <strong>Rapor Başlığı:</strong> {reportTitle}
                        </div>
                        <div>
                          <strong>Dönem:</strong>{" "}
                          {reportPeriod === "custom" && dateFrom && dateTo
                            ? `${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`
                            : reportPeriod}
                        </div>
                        <div>
                          <strong>Seçili Krediler:</strong> {selectedCredits.length || totalCreditsCount} adet
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <strong>İçerik Bölümleri:</strong> {selectedSectionsCount} adet
                        </div>
                        <div>
                          <strong>Grafikler:</strong> {selectedChartsCount} adet
                        </div>
                        <div>
                          <strong>Format:</strong> PDF - Türkçe
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {selectedCredits.length || totalCreditsCount}
                      </div>
                      <div className="text-sm text-green-700 font-medium">Toplam Kredi</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        ₺{totalDebtAmount.toLocaleString("tr-TR")}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">Toplam Borç</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        ₺{totalMonthlyPayment.toLocaleString("tr-TR")}
                      </div>
                      <div className="text-sm text-purple-700 font-medium">Aylık Ödeme</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg shadow-xl rounded-2xl"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Rapor Hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <Download className="mr-3 h-6 w-6" />
                        PDF Raporunu İndir
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 h-12 px-6 rounded-xl bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki Adım
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl"
            >
              Sonraki Adım
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
