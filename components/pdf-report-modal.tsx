"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText, Settings, Filter, BarChart3, PieChart, TrendingUp, Building2, CreditCard, Wallet, AlertTriangle, Loader2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
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
    summary: any
  }
  trigger?: React.ReactNode
}

const WIZARD_STEPS = [
  { id: 'basic', title: 'Temel Ayarlar', icon: Settings },
  { id: 'content', title: 'İçerik Seçimi', icon: Filter },
  { id: 'charts', title: 'Grafik Seçimi', icon: BarChart3 },
  { id: 'format', title: 'Format Ayarları', icon: FileText },
  { id: 'preview', title: 'Önizleme', icon: CheckCircle }
]

export default function PDFReportModal({ userData, trigger }: PDFReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { toast } = useToast()

  // Form state
  const [reportTitle, setReportTitle] = useState("Finansal Durum Raporu")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [reportPeriod, setReportPeriod] = useState("custom")
  
  // Content selection
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    credits: true,
    payments: true,
    creditCards: true,
    analysis: true,
    charts: true
  })

  // Chart options
  const [chartOptions, setChartOptions] = useState({
    monthlyTrend: true,
    debtDistribution: true,
    bankComparison: true,
    paymentHistory: true,
    utilizationRates: false
  })

  // Report format options
  const [formatOptions, setFormatOptions] = useState({
    language: "tr",
    currency: "TRY",
    dateFormat: "dd/MM/yyyy",
    includeLogos: true,
    colorScheme: "modern",
    pageNumbers: true,
    watermark: false
  })

  // Bank filter options
  const [bankFilters, setBankFilters] = useState<string[]>([])

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period)
    const now = new Date()
    
    switch (period) {
      case "thisMonth":
        setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1))
        setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0))
        break
      case "lastMonth":
        setDateFrom(new Date(now.getFullYear(), now.getMonth() - 1, 1))
        setDateTo(new Date(now.getFullYear(), now.getMonth(), 0))
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
      case "lastYear":
        setDateFrom(new Date(now.getFullYear() - 1, 0, 1))
        setDateTo(new Date(now.getFullYear() - 1, 11, 31))
        break
      case "custom":
        // Keep current dates
        break
    }
  }

  const handleSectionToggle = (section: string, checked: boolean) => {
    setIncludeSections(prev => ({ ...prev, [section]: checked }))
  }

  const handleChartToggle = (chart: string, checked: boolean) => {
    setChartOptions(prev => ({ ...prev, [chart]: checked }))
  }

  const handleBankFilterToggle = (bank: string, checked: boolean) => {
    setBankFilters(prev => 
      checked 
        ? [...prev, bank]
        : prev.filter(b => b !== bank)
    )
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Prepare chart data
      const chartData: any = {}
      
      if (chartOptions.monthlyTrend) {
        // Aylik odeme verilerini hazirla
        const monthlyData = userData.credits
          ?.filter(credit => credit.status === 'active')
          ?.filter(credit => !bankFilters.length || bankFilters.includes(credit.bankName))
          ?.map(credit => {
            let monthName = ''
            if (credit.nextPaymentDate) {
              try {
                const date = new Date(credit.nextPaymentDate)
                if (!isNaN(date.getTime())) {
                  monthName = format(date, 'MMMM', { locale: tr })
                }
              } catch (error) {
                console.warn('Invalid date:', credit.nextPaymentDate)
              }
            }
            return {
              month: monthName,
              amount: credit.monthlyPayment || 0,
              bank: credit.bankName
            }
          }) || []
        chartData.monthlyPayments = monthlyData
      }
      
      if (chartOptions.debtDistribution) {
        // Kredi dagilim verilerini hazirla  
        const distributionData = (userData.credits || [])
          .filter(credit => !bankFilters.length || bankFilters.includes(credit.bankName))
          .reduce((acc: any[], credit) => {
            const existing = acc.find(item => item.bank === credit.bankName)
            if (existing) {
              existing.amount += credit.amount || 0
            } else {
              acc.push({
                bank: credit.bankName,
                amount: credit.amount || 0
              })
            }
            return acc
          }, [])
        chartData.creditDistribution = distributionData
      }
      
      if (chartOptions.bankComparison) {
        // Faiz analiz verilerini hazirla
        const interestData = (userData.credits || [])
          .filter(credit => !bankFilters.length || bankFilters.includes(credit.bankName))
          .map(credit => ({
            bank: credit.bankName,
            rate: credit.interestRate || 0,
            totalInterest: ((credit.amount || 0) * (credit.interestRate || 0) * (credit.term || 0)) / 1200
          }))
        chartData.interestAnalysis = interestData
      }
      
      if (chartOptions.paymentHistory) {
        // Odeme takvimi verilerini hazirla
        const calendarData = (userData.payments || [])
          .filter(payment => !bankFilters.length || bankFilters.includes(payment.bankName))
          .slice(0, 12)
          .map(payment => {
            let dateStr = ''
            if (payment.dueDate) {
              try {
                const date = new Date(payment.dueDate)
                if (!isNaN(date.getTime())) {
                  dateStr = format(date, 'dd.MM.yyyy')
                }
              } catch (error) {
                console.warn('Invalid payment date:', payment.dueDate)
              }
            }
            return {
              date: dateStr,
              amount: payment.amount || 0,
              status: payment.status || 'unknown'
            }
          })
        chartData.paymentCalendar = calendarData
      }
      
      // Generate PDF report data
      const reportData = {
        userData: {
          name: userData.summary?.name || 'Kullanici',
          email: userData.summary?.email || 'email@example.com'
        },
        totalCredits: userData.credits?.length || 0,
        activeCredits: userData.credits?.filter(c => c.status === 'active').length || 0,
        closedCredits: userData.credits?.filter(c => c.status === 'closed').length || 0,
        totalDebt: userData.credits?.reduce((sum, c) => sum + (c.remainingDebt || 0), 0) || 0,
        totalPayment: userData.credits?.reduce((sum, c) => sum + ((c.amount || 0) - (c.remainingDebt || 0)), 0) || 0,
        monthlyPayment: userData.credits?.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.monthlyPayment || 0), 0) || 0,
        credits: userData.credits || [],
        selectedReports: [
          ...(chartOptions.monthlyTrend ? ['monthly-payments'] : []),
          ...(chartOptions.debtDistribution ? ['credit-distribution'] : []),
          ...(chartOptions.bankComparison ? ['interest-chart'] : []),
          ...(chartOptions.paymentHistory ? ['payment-calendar'] : [])
        ],
        chartData,
        selectedBanks: bankFilters
      }
      
      generatePDFReport(reportData)
      
      toast({
        title: "Rapor Oluşturuldu",
        description: "PDF rapor başarıyla oluşturuldu ve indirildi.",
      })
      
      setIsOpen(false)
      resetModal()
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rapor oluşturulurken bir hata oluştu.",
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
    
    userData.credits?.forEach(credit => {
      if (credit.bankName) banks.add(credit.bankName)
    })
    
    userData.creditCards?.forEach(card => {
      if (card.bankName) banks.add(card.bankName)
    })
    
    userData.payments?.forEach(payment => {
      if (payment.bankName) banks.add(payment.bankName)
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
    setReportTitle("Finansal Durum Raporu")
    setDateFrom(undefined)
    setDateTo(new Date())
    setReportPeriod("custom")
    setIncludeSections({
      summary: true,
      credits: true,
      payments: true,
      creditCards: true,
      analysis: true,
      charts: true
    })
    setChartOptions({
      monthlyTrend: true,
      debtDistribution: true,
      bankComparison: true,
      paymentHistory: true,
      utilizationRates: false
    })
    setFormatOptions({
      language: "tr",
      currency: "TRY",
      dateFormat: "dd/MM/yyyy",
      includeLogos: true,
      colorScheme: "modern",
      pageNumbers: true,
      watermark: false
    })
    setBankFilters([])
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return reportTitle.trim() !== ""
      case 1:
        return selectedSectionsCount > 0
      case 2:
        return selectedChartsCount > 0 || !includeSections.charts
      default:
        return true
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetModal()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <Download className="h-5 w-5 mr-2" />
            Detaylı PDF Raporu
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-emerald-600" />
            PDF Rapor Oluştur - {WIZARD_STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription>
            Finansal verilerinizi detaylı raporlar halinde PDF formatında indirin
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-lg p-4 overflow-x-auto">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div key={step.id} className="flex items-center min-w-0">
                <button
                  onClick={() => goToStep(index)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isActive && "bg-emerald-600 text-white",
                    isCompleted && "bg-emerald-600 text-white",
                    !isActive && !isCompleted && "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
                <div className="ml-3 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isActive && "text-emerald-600",
                    isCompleted && "text-emerald-600",
                    !isActive && !isCompleted && "text-gray-400"
                  )}>
                    {step.title}
                  </p>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-2 shrink-0",
                    isCompleted ? "bg-emerald-600" : "bg-gray-300"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] mb-6">
          {/* Step 1: Basic Settings */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  Temel Ayarlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportTitle">Rapor Başlığı</Label>
                  <Input
                    id="reportTitle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Rapor başlığını girin"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Rapor Dönemi</Label>
                  <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">Bu Ay</SelectItem>
                      <SelectItem value="lastMonth">Geçen Ay</SelectItem>
                      <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                      <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                      <SelectItem value="thisYear">Bu Yıl</SelectItem>
                      <SelectItem value="lastYear">Geçen Yıl</SelectItem>
                      <SelectItem value="custom">Özel Tarih</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Başlangıç Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: tr }) : "Tarih seç"}
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
                    <div>
                      <Label>Bitiş Tarihi</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: tr }) : "Tarih seç"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo as any}
                            initialFocus
                            locale={tr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Content Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-600" />
                  İçerik Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(includeSections).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleSectionToggle(key, checked as boolean)}
                      />
                      <Label htmlFor={key} className="cursor-pointer">
                        {key === 'summary' && 'Genel Özet'}
                        {key === 'credits' && 'Krediler'}
                        {key === 'payments' && 'Ödemeler'}
                        {key === 'creditCards' && 'Kredi Kartları'}
                        {key === 'analysis' && 'Analiz'}
                        {key === 'charts' && 'Grafikler'}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Charts Selection */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Grafik Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(chartOptions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleChartToggle(key, checked as boolean)}
                      />
                      <Label htmlFor={key} className="cursor-pointer">
                        {key === 'monthlyTrend' && 'Aylık Ödeme Trendi'}
                        {key === 'debtDistribution' && 'Borç Dağılımı'}
                        {key === 'bankComparison' && 'Banka Karşılaştırması'}
                        {key === 'paymentHistory' && 'Ödeme Geçmişi'}
                        {key === 'utilizationRates' && 'Kullanım Oranları'}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Format Settings */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Format Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Dil</Label>
                    <Select value={formatOptions.language} onValueChange={(value) => setFormatOptions(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Para Birimi</Label>
                    <Select value={formatOptions.currency} onValueChange={(value) => setFormatOptions(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeLogos"
                      checked={formatOptions.includeLogos}
                      onCheckedChange={(checked) => setFormatOptions(prev => ({ ...prev, includeLogos: checked as boolean }))}
                    />
                    <Label htmlFor="includeLogos" className="cursor-pointer">Banka Logoları Dahil Et</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pageNumbers"
                      checked={formatOptions.pageNumbers}
                      onCheckedChange={(checked) => setFormatOptions(prev => ({ ...prev, pageNumbers: checked as boolean }))}
                    />
                    <Label htmlFor="pageNumbers" className="cursor-pointer">Sayfa Numaraları</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="watermark"
                      checked={formatOptions.watermark}
                      onCheckedChange={(checked) => setFormatOptions(prev => ({ ...prev, watermark: checked as boolean }))}
                    />
                    <Label htmlFor="watermark" className="cursor-pointer">Filigran Ekle</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Preview */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Önizleme ve Oluştur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Rapor Özeti</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Başlık:</strong> {reportTitle}</div>
                    <div><strong>Dönem:</strong> {reportPeriod === 'custom' && dateFrom && dateTo 
                      ? `${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`
                      : reportPeriod}</div>
                    <div><strong>İçerik Bölümleri:</strong> {selectedSectionsCount} adet</div>
                    <div><strong>Grafikler:</strong> {selectedChartsCount} adet</div>
                  </div>
                </div>
                
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PDF Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      PDF Raporunu İndir
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !canProceed()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  PDF İndir
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}