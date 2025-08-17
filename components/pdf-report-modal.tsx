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
import { Badge } from "@/components/ui/badge"
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
  TrendingUp,
  Wallet,
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
  {
    id: "basic",
    title: "Rapor Ayarları",
    icon: Settings,
    description: "Temel rapor bilgileri",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "content",
    title: "Kredi Seçimi",
    icon: CreditCard,
    description: "Dahil edilecek krediler",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "charts",
    title: "Grafik & Analiz",
    icon: BarChart3,
    description: "Görsel raporlar",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "preview",
    title: "Önizleme",
    icon: Eye,
    description: "Son kontrol ve oluştur",
    color: "from-orange-500 to-red-600",
  },
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

      // Call PDF generator
      await generatePDFReport(reportData)

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
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <Download className="h-5 w-5 mr-2" />
            PDF Rapor İndir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <DialogHeader className="pb-8 border-b border-gray-200/50">
          <DialogTitle className="flex items-center gap-4 text-3xl font-bold">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Kredi Portföy Raporu
              </div>
              <div className="text-lg font-normal text-gray-600 mt-2">Profesyonel PDF raporu oluşturun</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Ultra Modern Progress Steps */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-3xl opacity-50"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
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
                          "relative w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 transform",
                          isActive && "scale-110 shadow-2xl",
                          isCompleted && "shadow-xl",
                          !isActive && !isCompleted && "hover:scale-105 shadow-lg",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 rounded-3xl transition-all duration-500",
                            isActive && `bg-gradient-to-r ${step.color} opacity-100`,
                            isCompleted && "bg-gradient-to-r from-green-500 to-emerald-500 opacity-100",
                            !isActive && !isCompleted && "bg-white/80 backdrop-blur-sm border-2 border-gray-200",
                          )}
                        ></div>
                        <div className="relative z-10">
                          {isCompleted ? (
                            <CheckCircle className="h-8 w-8 text-white" />
                          ) : (
                            <Icon className={cn("h-8 w-8", isActive ? "text-white" : "text-gray-500")} />
                          )}
                        </div>
                      </button>
                      <div className="mt-4 text-center max-w-24">
                        <p
                          className={cn(
                            "text-sm font-bold transition-colors duration-300",
                            isActive && "text-emerald-600",
                            isCompleted && "text-green-600",
                            !isActive && !isCompleted && "text-gray-500",
                          )}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-tight">{step.description}</p>
                      </div>
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className="flex-1 mx-8 mt-10">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            isCompleted
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gray-200/50 backdrop-blur-sm",
                          )}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px] mb-8">
          {/* Step 1: Basic Settings */}
          {currentStep === 0 && (
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div>Rapor Ayarları</div>
                    <div className="text-sm font-normal text-gray-600 mt-1">Temel rapor bilgilerini belirleyin</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-10">
                <div className="space-y-4">
                  <Label htmlFor="reportTitle" className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Rapor Başlığı
                  </Label>
                  <Input
                    id="reportTitle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Rapor başlığını girin"
                    className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-2xl bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Rapor Dönemi
                  </Label>
                  <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-blue-500 rounded-2xl bg-white/80 backdrop-blur-sm text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
                      <SelectItem value="thisMonth" className="text-lg py-3 rounded-xl">
                        Bu Ay
                      </SelectItem>
                      <SelectItem value="last3Months" className="text-lg py-3 rounded-xl">
                        Son 3 Ay
                      </SelectItem>
                      <SelectItem value="last6Months" className="text-lg py-3 rounded-xl">
                        Son 6 Ay
                      </SelectItem>
                      <SelectItem value="thisYear" className="text-lg py-3 rounded-xl">
                        Bu Yıl
                      </SelectItem>
                      <SelectItem value="custom" className="text-lg py-3 rounded-xl">
                        Özel Tarih Aralığı
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-gray-800">Başlangıç Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-14 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-lg",
                              !dateFrom && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-3 h-5 w-5" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: tr }) : "Tarih seçin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl"
                          align="start"
                        >
                          <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus locale={tr} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-gray-800">Bitiş Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-14 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-lg",
                              !dateTo && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-3 h-5 w-5" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: tr }) : "Tarih seçin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl"
                          align="start"
                        >
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
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div>Kredi Seçimi</div>
                    <div className="text-sm font-normal text-gray-600 mt-1">Rapora dahil edilecek kredileri seçin</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold text-gray-800">Rapora Dahil Edilecek Krediler</Label>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        if (selectedCredits.length === creditsArray.length) {
                          setSelectedCredits([])
                        } else {
                          setSelectedCredits(creditsArray.map((c) => c.id))
                        }
                      }}
                      className="rounded-2xl border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-semibold"
                    >
                      {selectedCredits.length === creditsArray.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
                    </Button>
                  </div>

                  <div className="grid gap-4 max-h-96 overflow-y-auto pr-4">
                    {creditsArray.map((credit) => (
                      <div
                        key={credit.id}
                        className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center space-x-6 p-6">
                          <Checkbox
                            id={credit.id}
                            checked={selectedCredits.includes(credit.id)}
                            onCheckedChange={(checked) => handleCreditToggle(credit.id, checked as boolean)}
                            className="w-6 h-6 border-2 border-emerald-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={credit.id}
                              className="cursor-pointer font-bold text-lg text-gray-900 block mb-2"
                            >
                              {credit.bankName || credit.banks?.name || "Bilinmeyen Banka"} -{" "}
                              {credit.creditType || credit.credit_types?.name || "Diğer"}
                            </Label>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-red-500" />
                                <span>
                                  Kalan Borç:{" "}
                                  <span className="font-semibold text-red-600">
                                    ₺{(credit.remainingDebt || credit.remaining_debt || 0).toLocaleString("tr-TR")}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                <span>
                                  Aylık Ödeme:{" "}
                                  <span className="font-semibold text-blue-600">
                                    ₺{(credit.monthlyPayment || credit.monthly_payment || 0).toLocaleString("tr-TR")}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              "px-3 py-1 font-semibold",
                              credit.status === "active"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-700 border-gray-200",
                            )}
                          >
                            {credit.status === "active" ? "Aktif" : "Kapalı"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {creditsArray.length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <CreditCard className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                        <p className="text-xl font-semibold mb-2">Henüz kredi kaydı bulunmuyor.</p>
                        <p className="text-lg">Önce kredi ekleyerek başlayın.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <Label className="text-lg font-bold text-gray-800">Rapor İçeriği</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(includeSections).map(([key, value]) => (
                        <div
                          key={key}
                          className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-emerald-200 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center space-x-4 p-4">
                            <Checkbox
                              id={key}
                              checked={value}
                              onCheckedChange={(checked) => handleSectionToggle(key, checked as boolean)}
                              className="w-5 h-5 border-2 border-emerald-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <Label htmlFor={key} className="cursor-pointer font-semibold text-gray-800">
                              {key === "summary" && "📊 Genel Özet"}
                              {key === "creditDetails" && "💳 Kredi Detayları"}
                              {key === "paymentSchedule" && "📅 Ödeme Planı"}
                              {key === "interestAnalysis" && "📈 Faiz Analizi"}
                              {key === "riskAssessment" && "⚠️ Risk Değerlendirmesi"}
                            </Label>
                          </div>
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
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600"></div>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div>Grafik & Analiz Seçimi</div>
                    <div className="text-sm font-normal text-gray-600 mt-1">Rapora dahil edilecek grafikleri seçin</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(chartOptions).map(([key, value]) => (
                    <div
                      key={key}
                      className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-start space-x-6 p-6">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => handleChartToggle(key, checked as boolean)}
                          className="w-6 h-6 mt-1 border-2 border-purple-300 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <div className="flex-1">
                          <Label htmlFor={key} className="cursor-pointer font-bold text-lg text-gray-900 block mb-3">
                            {key === "paymentTrend" && "📈 Ödeme Trendi"}
                            {key === "debtDistribution" && "🏦 Borç Dağılımı"}
                            {key === "bankComparison" && "⚖️ Banka Karşılaştırması"}
                            {key === "interestComparison" && "📊 Faiz Karşılaştırması"}
                            {key === "paymentProgress" && "📅 Ödeme İlerlemesi"}
                          </Label>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {key === "paymentTrend" &&
                              "Aylık ödeme miktarlarının trend analizi ve gelecek projeksiyonları"}
                            {key === "debtDistribution" && "Bankalara göre borç dağılım grafiği ve oransal analiz"}
                            {key === "bankComparison" && "Bankalar arası detaylı karşılaştırma ve performans analizi"}
                            {key === "interestComparison" &&
                              "Faiz oranları ve maliyet analizi ile optimizasyon önerileri"}
                            {key === "paymentProgress" && "Ödeme ilerleme durumu takibi ve başarı oranları"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div>Rapor Önizlemesi</div>
                    <div className="text-sm font-normal text-gray-600 mt-1">Son kontrol ve rapor oluşturma</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="space-y-10">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 p-8 border-2 border-orange-100">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative">
                      <div className="flex items-center gap-4 mb-6">
                        <Sparkles className="h-8 w-8 text-orange-600" />
                        <h4 className="font-black text-2xl text-orange-800">📊 Rapor Özeti</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-8 text-base">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-orange-600" />
                            <div>
                              <span className="font-semibold text-gray-700">Rapor Başlığı:</span>
                              <div className="font-bold text-gray-900">{reportTitle}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-orange-600" />
                            <div>
                              <span className="font-semibold text-gray-700">Dönem:</span>
                              <div className="font-bold text-gray-900">
                                {reportPeriod === "custom" && dateFrom && dateTo
                                  ? `${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`
                                  : reportPeriod === "thisMonth"
                                    ? "Bu Ay"
                                    : reportPeriod === "last3Months"
                                      ? "Son 3 Ay"
                                      : reportPeriod === "last6Months"
                                        ? "Son 6 Ay"
                                        : reportPeriod === "thisYear"
                                          ? "Bu Yıl"
                                          : reportPeriod}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                            <div>
                              <span className="font-semibold text-gray-700">Seçili Krediler:</span>
                              <div className="font-bold text-gray-900">
                                {selectedCredits.length || totalCreditsCount} adet
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Settings className="h-5 w-5 text-orange-600" />
                            <div>
                              <span className="font-semibold text-gray-700">İçerik Bölümleri:</span>
                              <div className="font-bold text-gray-900">{selectedSectionsCount} adet</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-orange-600" />
                            <div>
                              <span className="font-semibold text-gray-700">Grafikler:</span>
                              <div className="font-bold text-gray-900">{selectedChartsCount} adet</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-orange-600" />
                            <div>
                              <span className="font-semibold text-gray-700">Format:</span>
                              <div className="font-bold text-gray-900">PDF - Türkçe</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100 p-8 border-2 border-green-200">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative text-center">
                        <div className="text-5xl font-black text-green-600 mb-3">
                          {selectedCredits.length || totalCreditsCount}
                        </div>
                        <div className="text-lg font-bold text-green-700">Toplam Kredi</div>
                        <div className="text-sm text-green-600 mt-2">Analiz edilecek</div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 border-2 border-blue-200">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative text-center">
                        <div className="text-5xl font-black text-blue-600 mb-3">
                          ₺{Math.round(totalDebtAmount / 1000)}K
                        </div>
                        <div className="text-lg font-bold text-blue-700">Toplam Borç</div>
                        <div className="text-sm text-blue-600 mt-2">Kalan tutar</div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-pink-100 p-8 border-2 border-purple-200">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="relative text-center">
                        <div className="text-5xl font-black text-purple-600 mb-3">
                          ₺{Math.round(totalMonthlyPayment / 1000)}K
                        </div>
                        <div className="text-lg font-bold text-purple-700">Aylık Ödeme</div>
                        <div className="text-sm text-purple-600 mt-2">Toplam taksit</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full h-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white font-black text-2xl shadow-2xl rounded-3xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                        Rapor Hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <Download className="mr-4 h-8 w-8" />
                        PDF Raporunu İndir
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ultra Modern Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200/50">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-3 h-14 px-8 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            <ChevronLeft className="h-5 w-5" />
            Önceki Adım
          </Button>

          <div className="flex items-center gap-2">
            {WIZARD_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 w-8"
                    : index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-300",
                )}
              />
            ))}
          </div>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-3 h-14 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-xl"
            >
              Sonraki Adım
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-32"></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
