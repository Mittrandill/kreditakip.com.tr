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
import { CalendarIcon, Download, FileText, Settings, BarChart3, CreditCard, Loader2, X, Sparkles } from "lucide-react"
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

  const resetModal = () => {
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
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Download className="h-5 w-5 mr-2" />
            PDF Rapor İndir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-8">
          {/* Rapor Ayarları */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Rapor Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportTitle" className="text-sm font-medium mb-2 block">
                  Rapor Başlığı
                </Label>
                <Input
                  id="reportTitle"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Rapor başlığını girin"
                  className="h-10"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Rapor Dönemi</Label>
                <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="h-10">
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
                    <Label className="text-sm font-medium mb-2 block">Başlangıç Tarihi</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
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
                    <Label className="text-sm font-medium mb-2 block">Bitiş Tarihi</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
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

          {/* Kredi Seçimi */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Kredi Seçimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Rapora Dahil Edilecek Krediler</Label>
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

                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {creditsArray.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg border hover:bg-white/90 transition-colors"
                    >
                      <Checkbox
                        id={credit.id}
                        checked={selectedCredits.includes(credit.id)}
                        onCheckedChange={(checked) => handleCreditToggle(credit.id, checked as boolean)}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <BankLogo
                          bankName={credit.bankName || credit.banks?.name || ""}
                          logoUrl={credit.banks?.logo_url}
                          size="sm"
                        />
                        <div className="flex-1">
                          <Label htmlFor={credit.id} className="cursor-pointer font-medium text-sm">
                            {credit.bankName || credit.banks?.name || "Bilinmeyen Banka"} -{" "}
                            {credit.creditType || credit.credit_types?.name || "Diğer"}
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            Kalan Borç: ₺{(credit.remainingDebt || credit.remaining_debt || 0).toLocaleString("tr-TR")}{" "}
                            | Aylık: ₺{(credit.monthlyPayment || credit.monthly_payment || 0).toLocaleString("tr-TR")}
                          </p>
                        </div>
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

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Rapor İçeriği</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(includeSections).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 p-2 bg-white/70 rounded-lg">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => handleSectionToggle(key, checked as boolean)}
                        />
                        <Label htmlFor={key} className="cursor-pointer text-sm">
                          {key === "summary" && "📊 Genel Özet"}
                          {key === "creditDetails" && "💳 Kredi Detayları"}
                          {key === "paymentSchedule" && "📅 Ödeme Planı"}
                          {key === "interestAnalysis" && "📈 Faiz Analizi"}
                          {key === "riskAssessment" && "⚠️ Risk Değerlendirmesi"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grafik Seçimi */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Grafik & Analiz Seçimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(chartOptions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start space-x-3 p-3 bg-white/70 rounded-lg border hover:bg-white/90 transition-colors"
                  >
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => handleChartToggle(key, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={key} className="cursor-pointer font-medium text-sm block mb-1">
                        {key === "paymentTrend" && "📈 Ödeme Trendi"}
                        {key === "debtDistribution" && "🏦 Borç Dağılımı"}
                        {key === "bankComparison" && "⚖️ Banka Karşılaştırması"}
                        {key === "interestComparison" && "📊 Faiz Karşılaştırması"}
                        {key === "paymentProgress" && "📅 Ödeme İlerlemesi"}
                      </Label>
                      <p className="text-xs text-gray-600">
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

          {/* Özet ve Oluştur */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-600" />
                Rapor Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {selectedCredits.length || totalCreditsCount}
                  </div>
                  <div className="text-sm text-gray-600">Toplam Kredi</div>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">₺{Math.round(totalDebtAmount / 1000)}K</div>
                  <div className="text-sm text-gray-600">Toplam Borç</div>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    ₺{Math.round(totalMonthlyPayment / 1000)}K
                  </div>
                  <div className="text-sm text-gray-600">Aylık Ödeme</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <div className="flex justify-between">
                    <span>İçerik Bölümleri:</span>
                    <Badge variant="secondary">{selectedSectionsCount} adet</Badge>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Grafikler:</span>
                    <Badge variant="secondary">{selectedChartsCount} adet</Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg shadow-lg"
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
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
