"use client"

import type React from "react"
import { useState } from "react"
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
  X,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { generatePDFReport } from "@/lib/utils/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import BankLogo from "@/components/bank-logo"

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

export default function PDFReportModal({ userData, trigger }: PDFReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const { toast } = useToast()

  // Form state
  const [reportTitle, setReportTitle] = useState("Kredi Portfoy Raporu")
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
          creditType: credit.creditType || credit.credit_types?.name || "Diger",
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

      const sanitizeText = (text: string) => {
        return text
          .replace(/ğ/g, "g")
          .replace(/Ğ/g, "G")
          .replace(/ü/g, "u")
          .replace(/Ü/g, "U")
          .replace(/ş/g, "s")
          .replace(/Ş/g, "S")
          .replace(/ı/g, "i")
          .replace(/İ/g, "I")
          .replace(/ö/g, "o")
          .replace(/Ö/g, "O")
          .replace(/ç/g, "c")
          .replace(/Ç/g, "C")
      }

      // Generate PDF report data with safe defaults
      const reportData = {
        reportTitle: sanitizeText(reportTitle),
        period: {
          from: dateFrom,
          to: dateTo,
          type: reportPeriod,
        },
        userData: {
          name: sanitizeText(userData.summary?.name || "Kullanici"),
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
          bankName: sanitizeText(credit.bankName || credit.banks?.name || "Bilinmeyen Banka"),
          creditType: sanitizeText(credit.creditType || credit.credit_types?.name || "Diger"),
          remainingDebt: credit.remainingDebt || credit.remaining_debt || 0,
          monthlyPayment: credit.monthlyPayment || credit.monthly_payment || 0,
          interestRate: credit.interestRate || credit.interest_rate || 0,
          status: credit.status || "unknown",
          amount: credit.amount || credit.initial_amount || 0,
        })),
        selectedReports: Object.keys(chartOptions).filter((key) => chartOptions[key as keyof typeof chartOptions]),
        chartData,
        selectedBanks: [
          ...new Set(filteredCredits.map((c) => sanitizeText(c.bankName || c.banks?.name || "")).filter(Boolean)),
        ],
      }

      // Call PDF generator
      await generatePDFReport(reportData)

      toast({
        title: "Rapor Hazirlandi",
        description: "Kredi portfoy raporunuz basariyla olusturuldu ve indirildi.",
      })

      setIsOpen(false)
      resetModal()
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        variant: "destructive",
        title: "Hata Olustu",
        description: "Rapor olusturulurken bir sorun yasandi. Lutfen tekrar deneyin.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedSectionsCount = Object.values(includeSections).filter(Boolean).length
  const selectedChartsCount = Object.values(chartOptions).filter(Boolean).length

  const resetModal = () => {
    setReportTitle("Kredi Portfoy Raporu")
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
    setCurrentStep(1)
  }

  // Safe calculations for display
  const creditsArray = userData.credits || []
  const totalCreditsCount = creditsArray.length
  const totalDebtAmount = creditsArray.reduce((sum, c) => sum + (c.remainingDebt || c.remaining_debt || 0), 0)
  const totalMonthlyPayment = creditsArray
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (c.monthlyPayment || c.monthly_payment || 0), 0)

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return reportTitle.trim() !== ""
      case 2:
        return true // Can proceed even with no credits selected (will use all)
      case 3:
        return selectedSectionsCount > 0 || selectedChartsCount > 0
      case 4:
        return true
      default:
        return false
    }
  }

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
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Download className="h-5 w-5 mr-2" />
            PDF Rapor Indir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-4 text-2xl font-semibold text-gray-900">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div>PDF Rapor Olustur</div>
              <div className="text-sm font-normal text-gray-500 mt-1">
                Kredi portfoyunuz icin detayli rapor hazirlayın - Adim {currentStep}/4
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-4 px-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  step === currentStep
                    ? "bg-emerald-600 text-white"
                    : step < currentStep
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400",
                )}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-2 transition-colors",
                    step < currentStep ? "bg-emerald-600" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="py-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Temel Ayarlar</h3>
              </div>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reportTitle" className="text-sm font-medium text-gray-700">
                        Rapor Basligi
                      </Label>
                      <Input
                        id="reportTitle"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="Rapor basligini girin"
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Rapor Donemi</Label>
                      <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="thisMonth">Bu Ay</SelectItem>
                          <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                          <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                          <SelectItem value="thisYear">Bu Yil</SelectItem>
                          <SelectItem value="custom">Ozel Tarih Araligi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {reportPeriod === "custom" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Baslangic Tarihi</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 border-gray-300",
                                !dateFrom && "text-gray-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: tr }) : "Tarih secin"}
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
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Bitis Tarihi</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11 border-gray-300",
                                !dateTo && "text-gray-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: tr }) : "Tarih secin"}
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
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Kredi Secimi</h3>
              </div>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-6">
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
                        className="h-9 px-3 text-sm border-gray-300 hover:bg-gray-50"
                      >
                        {selectedCredits.length === creditsArray.length ? "Hicbirini Secme" : "Tumunu Sec"}
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {creditsArray.map((credit) => (
                        <div
                          key={credit.id}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Checkbox
                            id={credit.id}
                            checked={selectedCredits.includes(credit.id)}
                            onCheckedChange={(checked) => handleCreditToggle(credit.id, checked as boolean)}
                            className="border-gray-400"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <BankLogo
                              bankName={credit.bankName || credit.banks?.name || ""}
                              logoUrl={credit.banks?.logo_url}
                              size="sm"
                            />
                            <div className="flex-1">
                              <Label htmlFor={credit.id} className="cursor-pointer font-medium text-sm text-gray-900">
                                {credit.bankName || credit.banks?.name || "Bilinmeyen Banka"} -{" "}
                                {credit.creditType || credit.credit_types?.name || "Diger"}
                              </Label>
                              <p className="text-xs text-gray-500 mt-1">
                                Kalan Borc: ₺
                                {(credit.remainingDebt || credit.remaining_debt || 0).toLocaleString("tr-TR")} | Aylik:
                                ₺{(credit.monthlyPayment || credit.monthly_payment || 0).toLocaleString("tr-TR")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {creditsArray.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Henuz kredi kaydi bulunmuyor.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Icerik Secimi</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Report Sections */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="h-5 w-5 text-gray-600" />
                      Rapor Bolumleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(includeSections).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => handleSectionToggle(key, checked as boolean)}
                          className="border-gray-400"
                        />
                        <Label htmlFor={key} className="cursor-pointer text-sm font-medium text-gray-900 flex-1">
                          {key === "summary" && "Genel Ozet"}
                          {key === "creditDetails" && "Kredi Detaylari"}
                          {key === "paymentSchedule" && "Odeme Plani"}
                          {key === "interestAnalysis" && "Faiz Analizi"}
                          {key === "riskAssessment" && "Risk Degerlendirmesi"}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Chart Options */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5 text-gray-600" />
                      Grafik Secimi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(chartOptions).map(([key, value]) => (
                      <div key={key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => handleChartToggle(key, checked as boolean)}
                          className="mt-0.5 border-gray-400"
                        />
                        <div className="flex-1">
                          <Label htmlFor={key} className="cursor-pointer font-medium text-sm text-gray-900 block mb-1">
                            {key === "paymentTrend" && "Odeme Trendi"}
                            {key === "debtDistribution" && "Borc Dagilimi"}
                            {key === "bankComparison" && "Banka Karsilastirmasi"}
                            {key === "interestComparison" && "Faiz oranlari ve maliyet analizi"}
                            {key === "paymentProgress" && "Odeme Ilerleme durumu takibi"}
                          </Label>
                          <p className="text-xs text-gray-500">
                            {key === "paymentTrend" && "Aylik odeme miktarlarinin trend analizi"}
                            {key === "debtDistribution" && "Bankalara gore borc dagilim grafigi"}
                            {key === "bankComparison" && "Bankalar arasi detayli karsilastirma"}
                            {key === "interestComparison" && "Faiz oranlari ve maliyet analizi"}
                            {key === "paymentProgress" && "Odeme ilerleme durumu takibi"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Ozet ve Olustur</h3>
              </div>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <CreditCard className="h-8 w-8 text-white/80" />
                            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                          </div>
                          <div className="text-3xl font-bold mb-1">{selectedCredits.length || totalCreditsCount}</div>
                          <div className="text-emerald-100 text-sm font-medium">Toplam Kredi</div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <BarChart3 className="h-8 w-8 text-white/80" />
                            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                          </div>
                          <div className="text-3xl font-bold mb-1">₺{Math.round(totalDebtAmount / 1000)}K</div>
                          <div className="text-blue-100 text-sm font-medium">Toplam Borc</div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <CalendarIcon className="h-8 w-8 text-white/80" />
                            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                          </div>
                          <div className="text-3xl font-bold mb-1">₺{Math.round(totalMonthlyPayment / 1000)}K</div>
                          <div className="text-purple-100 text-sm font-medium">Aylik Odeme</div>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-lg">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5"></div>
                      <div className="relative p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Settings className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{selectedSectionsCount}</div>
                                <div className="text-sm text-gray-600">Icerik Bolumu</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{selectedChartsCount}</div>
                                <div className="text-sm text-gray-600">Grafik</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold px-4 py-1">
                              Hazir
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <Button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 rounded-2xl border-0 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span>Rapor Hazirlaniyor...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Download className="h-5 w-5" />
                              </div>
                              <span>PDF Raporunu Indir</span>
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Geri
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Devam
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Kapat
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
