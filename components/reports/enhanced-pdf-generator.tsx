"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  FileText,
  Sparkles,
  CheckCircle,
  Settings,
  Palette,
  Layout,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Building2,
  CreditCard,
  Zap,
  Shield,
  Award,
  Star,
} from "lucide-react"
import { generateEnhancedPDFReport } from "@/lib/pdf-generator-enhanced"
import { useToast } from "@/hooks/use-toast"

interface EnhancedPDFGeneratorProps {
  userData: {
    name: string
    email: string
    credits: any[]
    payments: any[]
    creditCards: any[]
    summary: {
      totalDebt: number
      monthlyPayment: number
      activeCredits: number
      activeCreditCards: number
      averageUtilization: number
      paymentPerformance: number
      riskScore: number
    }
  }
  trigger: React.ReactNode
}

export function EnhancedPDFGenerator({ userData, trigger }: EnhancedPDFGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  // Report sections configuration
  const [selectedSections, setSelectedSections] = useState({
    executiveSummary: true,
    financialOverview: true,
    creditAnalysis: true,
    paymentHistory: true,
    creditCardAnalysis: true,
    bankDistribution: true,
    performanceMetrics: true,
    riskAssessment: true,
    aiInsights: true,
    recommendations: true,
    futureProjections: true,
    detailedTables: true,
    charts: true,
    appendix: false,
  })

  // Report customization options
  const [reportOptions, setReportOptions] = useState({
    includeCharts: true,
    includeAIInsights: true,
    includeRiskAnalysis: true,
    includePredictions: true,
    colorScheme: "professional", // professional, modern, minimal
    layout: "detailed", // detailed, summary, executive
    language: "tr", // tr, en
  })

  const reportSections = [
    {
      id: "executiveSummary",
      name: "Yönetici Özeti",
      description: "Finansal durumun genel özeti",
      icon: <Star className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "financialOverview",
      name: "Finansal Genel Bakış",
      description: "Toplam borç, ödeme ve performans metrikleri",
      icon: <BarChart3 className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "creditAnalysis",
      name: "Kredi Analizi",
      description: "Detaylı kredi portföy analizi",
      icon: <TrendingUp className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "paymentHistory",
      name: "Ödeme Geçmişi",
      description: "Ödeme performansı ve geçmiş analizi",
      icon: <Calendar className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "creditCardAnalysis",
      name: "Kredi Kartı Analizi",
      description: "Kart kullanım oranları ve optimizasyon",
      icon: <CreditCard className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "bankDistribution",
      name: "Banka Dağılımı",
      description: "Bankalar arası borç dağılımı",
      icon: <Building2 className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "performanceMetrics",
      name: "Performans Metrikleri",
      description: "KPI'lar ve performans göstergeleri",
      icon: <Award className="h-4 w-4" />,
      premium: true,
    },
    {
      id: "riskAssessment",
      name: "Risk Değerlendirmesi",
      description: "AI destekli risk analizi",
      icon: <Shield className="h-4 w-4" />,
      premium: true,
    },
    {
      id: "aiInsights",
      name: "AI İçgörüleri",
      description: "Yapay zeka destekli öneriler",
      icon: <Zap className="h-4 w-4" />,
      premium: true,
    },
    {
      id: "recommendations",
      name: "Öneriler",
      description: "Kişiselleştirilmiş finansal öneriler",
      icon: <Sparkles className="h-4 w-4" />,
      premium: true,
    },
    {
      id: "futureProjections",
      name: "Gelecek Projeksiyonları",
      description: "AI tahminleri ve senaryolar",
      icon: <TrendingUp className="h-4 w-4" />,
      premium: true,
    },
    {
      id: "detailedTables",
      name: "Detaylı Tablolar",
      description: "Tüm veriler için detaylı tablolar",
      icon: <FileText className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "charts",
      name: "Grafikler ve Görseller",
      description: "İnteraktif grafikler ve görselleştirmeler",
      icon: <PieChart className="h-4 w-4" />,
      premium: false,
    },
    {
      id: "appendix",
      name: "Ekler",
      description: "Ek bilgiler ve referanslar",
      icon: <FileText className="h-4 w-4" />,
      premium: false,
    },
  ]

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) => ({
      ...prev,
      [sectionId]: !(prev as any)[sectionId],
    }))
  }

  const handleGeneratePDF = async () => {
    setGenerating(true)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressSteps = [
        { step: 10, message: "Veriler hazırlanıyor..." },
        { step: 25, message: "Grafikler oluşturuluyor..." },
        { step: 40, message: "AI analizleri yapılıyor..." },
        { step: 60, message: "Risk değerlendirmesi..." },
        { step: 80, message: "PDF formatlanıyor..." },
        { step: 95, message: "Son kontroller..." },
        { step: 100, message: "Tamamlandı!" },
      ]

      for (const { step, message } of progressSteps) {
        setProgress(step)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Generate the enhanced PDF
      await generateEnhancedPDFReport({
        selectedSections,
        reportOptions,
      } as any)

      toast({
        title: "PDF Rapor Oluşturuldu",
        description: "Gelişmiş PDF raporunuz başarıyla oluşturuldu ve indirildi.",
        variant: "default",
      })

      setOpen(false)
    } catch (error) {
      toast({
        title: "Hata",
        description: "PDF rapor oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  const selectedCount = Object.values(selectedSections).filter(Boolean).length
  const totalSections = Object.keys(selectedSections).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            Premium PDF Rapor Oluşturucu
          </DialogTitle>
          <DialogDescription className="text-base">
            Profesyonel finansal raporunuzu özelleştirin ve AI destekli analizlerle zenginleştirin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar (when generating) */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rapor oluşturuluyor...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Report Sections Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rapor Bölümleri</h3>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                {selectedCount}/{totalSections} seçili
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportSections.map((section) => (
                <div
                  key={section.id}
                  className={`p-4 border rounded-xl transition-all duration-200 ${
                    (selectedSections as any)[section.id]
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={section.id}
                      checked={(selectedSections as any)[section.id]}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {section.icon}
                        <Label htmlFor={section.id} className="font-medium cursor-pointer">
                          {section.name}
                        </Label>
                        {section.premium && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Report Customization Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Özelleştirme Seçenekleri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Scheme */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Renk Teması
                </Label>
                <div className="space-y-2">
                  {[
                    { value: "professional", label: "Profesyonel", colors: ["#059669", "#0d9488", "#3b82f6"] },
                    { value: "modern", label: "Modern", colors: ["#8b5cf6", "#ec4899", "#f59e0b"] },
                    { value: "minimal", label: "Minimal", colors: ["#6b7280", "#374151", "#1f2937"] },
                  ].map((scheme) => (
                    <div
                      key={scheme.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        reportOptions.colorScheme === scheme.value
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setReportOptions((prev) => ({ ...prev, colorScheme: scheme.value }))}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{scheme.label}</span>
                        <div className="flex gap-1">
                          {scheme.colors.map((color, index) => (
                            <div key={index} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Rapor Düzeni
                </Label>
                <div className="space-y-2">
                  {[
                    { value: "detailed", label: "Detaylı", description: "Tüm analizler ve grafikler" },
                    { value: "summary", label: "Özet", description: "Ana metrikler ve önemli noktalar" },
                    { value: "executive", label: "Yönetici", description: "Üst düzey özet ve öneriler" },
                  ].map((layout) => (
                    <div
                      key={layout.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        reportOptions.layout === layout.value
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setReportOptions((prev) => ({ ...prev, layout: layout.value }))}
                    >
                      <div className="font-medium">{layout.label}</div>
                      <div className="text-sm text-gray-600">{layout.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={reportOptions.includeCharts}
                  onCheckedChange={(checked) =>
                    setReportOptions((prev) => ({ ...prev, includeCharts: checked as boolean }))
                  }
                />
                <Label htmlFor="includeCharts" className="text-sm">
                  Grafikler dahil
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAIInsights"
                  checked={reportOptions.includeAIInsights}
                  onCheckedChange={(checked) =>
                    setReportOptions((prev) => ({ ...prev, includeAIInsights: checked as boolean }))
                  }
                />
                <Label htmlFor="includeAIInsights" className="text-sm">
                  AI İçgörüleri
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRiskAnalysis"
                  checked={reportOptions.includeRiskAnalysis}
                  onCheckedChange={(checked) =>
                    setReportOptions((prev) => ({ ...prev, includeRiskAnalysis: checked as boolean }))
                  }
                />
                <Label htmlFor="includeRiskAnalysis" className="text-sm">
                  Risk Analizi
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePredictions"
                  checked={reportOptions.includePredictions}
                  onCheckedChange={(checked) =>
                    setReportOptions((prev) => ({ ...prev, includePredictions: checked as boolean }))
                  }
                />
                <Label htmlFor="includePredictions" className="text-sm">
                  Tahminler
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Report Preview Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Rapor Önizlemesi</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Sayfa Sayısı:</span>
                    <div className="text-blue-900">{Math.ceil(selectedCount * 2.5)} sayfa</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Grafik Sayısı:</span>
                    <div className="text-blue-900">{reportOptions.includeCharts ? selectedCount * 2 : 0}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">AI Analiz:</span>
                    <div className="text-blue-900">{reportOptions.includeAIInsights ? "Dahil" : "Hariç"}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Dosya Boyutu:</span>
                    <div className="text-blue-900">~{Math.ceil(selectedCount * 0.8)} MB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>256-bit SSL şifreleme ile güvenli</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>
                İptal
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={generating || selectedCount === 0}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Premium PDF Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
