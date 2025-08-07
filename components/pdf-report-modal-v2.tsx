"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, FileText, Settings, Filter, BarChart3, CheckCircle, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { generatePDFReport } from "@/lib/utils/pdf-generator-modern"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

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
  { id: 'settings', title: 'Ayarlar', icon: Settings },
  { id: 'content', title: 'İçerik', icon: Filter },
  { id: 'preview', title: 'Önizle', icon: FileText }
]

export default function PDFReportModal({ userData, trigger }: PDFReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { toast } = useToast()

  // Form state
  const [reportTitle, setReportTitle] = useState("Finansal Durum Raporu")
  const [reportPeriod, setReportPeriod] = useState("all")
  
  // Content selection
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    credits: true,
    payments: true,
    creditCards: true,
    recommendations: true
  })

  const handleSectionToggle = (section: string) => {
    setIncludeSections(prev => ({ ...prev, [section]: !(prev as any)[section] }))
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Prepare report data
      const reportData = {
        title: reportTitle,
        userData: {
          name: userData.summary?.name || 'Kullanıcı',
          email: userData.summary?.email || ''
        },
        totalCredits: userData.credits?.length || 0,
        activeCredits: userData.credits?.filter(c => c.status === 'active').length || 0,
        totalDebt: userData.summary?.totalDebt || 0,
        monthlyPayment: userData.summary?.monthlyPayment || 0,
        credits: includeSections.credits ? userData.credits : [],
        payments: includeSections.payments ? userData.payments : [],
        creditCards: includeSections.creditCards ? userData.creditCards : [],
        summary: includeSections.summary ? userData.summary : null,
        includeRecommendations: includeSections.recommendations
      }
      
      // Generate PDF
      generatePDFReport(reportData)
      
      toast({
        title: "Rapor Oluşturuldu",
        description: "PDF rapor başarıyla indirildi.",
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

  const resetModal = () => {
    setCurrentStep(0)
    setReportTitle("Finansal Durum Raporu")
    setReportPeriod("all")
    setIncludeSections({
      summary: true,
      credits: true,
      payments: true,
      creditCards: true,
      recommendations: true
    })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return reportTitle.trim() !== ""
      case 1:
        return Object.values(includeSections).some(v => v)
      default:
        return true
    }
  }

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

  const selectedSectionsCount = Object.values(includeSections).filter(Boolean).length
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetModal()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg">
            <Download className="h-5 w-5 mr-2" />
            PDF Raporu İndir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">PDF Rapor Oluştur</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Finansal verilerinizin detaylı PDF raporunu oluşturun
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all",
                    isActive && "bg-emerald-50 text-emerald-600",
                    isCompleted && "text-emerald-600 cursor-pointer hover:bg-gray-50",
                    !isActive && !isCompleted && "text-gray-400 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-emerald-600 text-white",
                    isCompleted && "bg-emerald-100 text-emerald-600",
                    !isActive && !isCompleted && "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-6 min-h-[300px]">
          {/* Step 1: Settings */}
          {currentStep === 0 && (
            <div className="space-y-4">
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
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Dönem</SelectItem>
                    <SelectItem value="thisMonth">Bu Ay</SelectItem>
                    <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                    <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                    <SelectItem value="thisYear">Bu Yıl</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Rapor Özellikleri
                  </h4>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• Modern ve profesyonel tasarım</li>
                    <li>• Detaylı finansal tablolar</li>
                    <li>• Özelleştirilmiş öneriler</li>
                    <li>• Kolay okunabilir format</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Content Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Rapora dahil edilecek bölümler:</h3>
              
              <div className="space-y-3">
                {Object.entries({
                  summary: 'Genel Özet',
                  credits: 'Kredi Detayları',
                  payments: 'Ödeme Geçmişi',
                  creditCards: 'Kredi Kartları',
                  recommendations: 'Öneriler ve Analizler'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id={key}
                      checked={includeSections[key as keyof typeof includeSections]}
                      onCheckedChange={() => handleSectionToggle(key)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label 
                      htmlFor={key} 
                      className="flex-1 cursor-pointer text-sm font-medium"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500 mt-4">
                {selectedSectionsCount} bölüm seçildi
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card className="border-emerald-200">
                <CardHeader className="bg-emerald-50">
                  <CardTitle className="text-lg text-emerald-800">Rapor Önizleme</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Başlık:</span>
                      <span className="text-sm font-medium">{reportTitle}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Dönem:</span>
                      <span className="text-sm font-medium">
                        {reportPeriod === 'all' ? 'Tüm Dönem' : 
                         reportPeriod === 'thisMonth' ? 'Bu Ay' :
                         reportPeriod === 'last3Months' ? 'Son 3 Ay' :
                         reportPeriod === 'last6Months' ? 'Son 6 Ay' : 'Bu Yıl'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">İçerik:</span>
                      <span className="text-sm font-medium">{selectedSectionsCount} bölüm</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Dahil Edilen Bölümler:</h4>
                    <ul className="space-y-1">
                      {Object.entries(includeSections)
                        .filter(([_, included]) => included)
                        .map(([key, _]) => (
                          <li key={key} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            {key === 'summary' && 'Genel Özet'}
                            {key === 'credits' && 'Kredi Detayları'}
                            {key === 'payments' && 'Ödeme Geçmişi'}
                            {key === 'creditCards' && 'Kredi Kartları'}
                            {key === 'recommendations' && 'Öneriler ve Analizler'}
                          </li>
                        ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Geri
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              İleri
            </Button>
          ) : (
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !canProceed()}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
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