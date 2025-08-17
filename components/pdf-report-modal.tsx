"use client"

import type React from "react"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

  // Report format options
  const [formatOptions, setFormatOptions] = useState({
    language: "tr",
    currency: "TRY",
    includeLogos: true,
    colorScheme: "professional",
    pageNumbers: true,
    confidential: false,
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
    setFormatOptions({
      language: "tr",
      currency: "TRY",
      includeLogos: true,
      colorScheme: "professional",
      pageNumbers: true,
      confidential: false,
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
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            PDF Rapor İndir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Kredi Portföy Raporu
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Kredilerinizin detaylı analizini PDF formatında indirin
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
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
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
                      isActive && "bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110",
                      isCompleted && "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
                      !isActive && !isCompleted && "bg-white text-gray-400 hover:bg-gray-100",
                    )}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </button>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-blue-600",
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
                      "w-16 h-0.5 mx-4 mt-6",
                      isCompleted ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-300",
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] mb-8">
          {/* Step 1: Basic Settings */}
          {currentStep === 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Settings className="h-5 w-5" />
                  Rapor Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <Label htmlFor="reportTitle" className="text-sm font-medium text-gray-700">
                    Rapor Başlığı
                  </Label>
                  <Input
                    id="reportTitle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Rapor başlığını girin"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Rapor Dönemi</Label>
                  <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="mt-2 h-11">
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
                      <Label className="text-sm font-medium text-gray-700">Başlangıç Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-2 h-11",
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
                      <Label className="text-sm font-medium text-gray-700">Bitiş Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-2 h-11",
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CreditCard className="h-5 w-5" />
                  Kredi Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Rapora Dahil Edilecek Krediler</Label>
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
                    >
                      {selectedCredits.length === creditsArray.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
                    </Button>
                  </div>

                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {creditsArray.map((credit) => (
                      <div
                        key={credit.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox
                          id={credit.id}
                          checked={selectedCredits.includes(credit.id)}
                          onCheckedChange={(checked) => handleCreditToggle(credit.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={credit.id} className="cursor-pointer font-medium">
                            {credit.bankName || credit.banks?.name || "Bilinmeyen Banka"} -{" "}
                            {credit.creditType || credit.credit_types?.name || "Diğer"}
                          </Label>
                          <p className="text-sm text-gray-500">
                            Kalan Borç: ₺{(credit.remainingDebt || credit.remaining_debt || 0).toLocaleString("tr-TR")}{" "}
                            | Aylık Ödeme: ₺
                            {(credit.monthlyPayment || credit.monthly_payment || 0).toLocaleString("tr-TR")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {creditsArray.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Henüz kredi kaydı bulunmuyor.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Rapor İçeriği</Label>
                    {Object.entries(includeSections).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => handleSectionToggle(key, checked as boolean)}
                        />
                        <Label htmlFor={key} className="cursor-pointer">
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
              </CardContent>
            </Card>
          )}

          {/* Step 3: Charts Selection */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <BarChart3 className="h-5 w-5" />
                  Grafik & Analiz Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(chartOptions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleChartToggle(key, checked as boolean)}
                      />
                      <div>
                        <Label htmlFor={key} className="cursor-pointer font-medium">
                          {key === "paymentTrend" && "Ödeme Trendi"}
                          {key === "debtDistribution" && "Borç Dağılımı"}
                          {key === "bankComparison" && "Banka Karşılaştırması"}
                          {key === "interestComparison" && "Faiz Karşılaştırması"}
                          {key === "paymentProgress" && "Ödeme İlerlemesi"}
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          {key === "paymentTrend" && "Aylık ödeme miktarlarının grafiği"}
                          {key === "debtDistribution" && "Bankalara göre borç dağılımı"}
                          {key === "bankComparison" && "Bankalar arası karşılaştırma"}
                          {key === "interestComparison" && "Faiz oranları analizi"}
                          {key === "paymentProgress" && "Ödeme ilerleme durumu"}
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <Eye className="h-5 w-5" />
                  Rapor Önizlemesi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                    <h4 className="font-bold text-lg text-blue-800 mb-4">📊 Rapor Özeti</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedCredits.length || totalCreditsCount}
                      </div>
                      <div className="text-sm text-green-700">Toplam Kredi</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">₺{totalDebtAmount.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-blue-700">Toplam Borç</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        ₺{totalMonthlyPayment.toLocaleString("tr-TR")}
                      </div>
                      <div className="text-sm text-purple-700">Aylık Ödeme</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Rapor Hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
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
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 h-11 px-6 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki Adım
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
