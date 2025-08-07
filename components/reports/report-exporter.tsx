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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Share2,
  CheckCircle,
  Loader2,
  Mail,
  Cloud,
  Smartphone,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportExporterProps {
  data: {
    credits: any[]
    payments: any[]
    creditCards: any[]
    summary: any
  }
  trigger: React.ReactNode
}

export function ReportExporter({ data, trigger }: ReportExporterProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState("excel")
  const [selectedData, setSelectedData] = useState({
    credits: true,
    payments: true,
    creditCards: true,
    summary: true,
    charts: false,
  })
  const { toast } = useToast()

  const exportFormats = [
    {
      value: "excel",
      label: "Excel (.xlsx)",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      description: "Detaylı tablolar ve formüller",
    },
    {
      value: "csv",
      label: "CSV (.csv)",
      icon: <Database className="h-4 w-4" />,
      description: "Ham veri formatı",
    },
    {
      value: "json",
      label: "JSON (.json)",
      icon: <FileText className="h-4 w-4" />,
      description: "API uyumlu format",
    },
  ]

  const dataTypes = [
    {
      key: "credits",
      label: "Krediler",
      description: "Tüm kredi bilgileri ve detayları",
      count: data.credits.length,
    },
    {
      key: "payments",
      label: "Ödemeler",
      description: "Ödeme geçmişi ve planları",
      count: data.payments.length,
    },
    {
      key: "creditCards",
      label: "Kredi Kartları",
      description: "Kart bilgileri ve kullanım oranları",
      count: data.creditCards.length,
    },
    {
      key: "summary",
      label: "Özet Bilgiler",
      description: "Genel finansal durum özeti",
      count: 1,
    },
    {
      key: "charts",
      label: "Grafik Verileri",
      description: "Görselleştirme için ham veriler",
      count: 4,
    },
  ]

  const handleDataToggle = (key: string) => {
    setSelectedData((prev) => ({
      ...prev,
      [key]: !(prev as any)[key],
    }))
  }

  const generateExcelData = () => {
    const workbook: any = {}

    if (selectedData.credits) {
      workbook.Krediler = data.credits.map((credit) => ({
        Banka: credit.banks?.name || "N/A",
        "Kredi Tipi": credit.credit_types?.name || "N/A",
        "Kalan Borç": credit.remaining_debt,
        "Aylık Ödeme": credit.monthly_payment,
        "Faiz Oranı": credit.interest_rate,
        Durum: credit.status,
        "Başlangıç Tarihi": credit.start_date,
        "Bitiş Tarihi": credit.end_date,
      }))
    }

    if (selectedData.payments) {
      workbook.Odemeler = data.payments.map((payment) => ({
        Banka: payment.credits?.banks?.name || "N/A",
        "Kredi Kodu": payment.credits?.credit_code || "N/A",
        "Vade Tarihi": payment.due_date,
        "Taksit No": payment.installment_number,
        "Toplam Ödeme": payment.total_payment,
        "Ana Para": payment.principal_payment,
        Faiz: payment.interest_payment,
        Durum: payment.status,
        "Ödeme Tarihi": payment.payment_date,
      }))
    }

    if (selectedData.creditCards) {
      workbook.KrediKartlari = data.creditCards.map((card) => ({
        "Kart Adı": card.card_name,
        Banka: card.bank_name,
        "Kredi Limiti": card.credit_limit,
        "Mevcut Borç": card.current_debt,
        "Kullanım Oranı": card.utilization_rate,
        Durum: card.is_active ? "Aktif" : "Pasif",
        "Son Kullanım": card.last_statement_date,
      }))
    }

    if (selectedData.summary) {
      workbook.Ozet = [
        {
          "Toplam Borç": data.summary.totalDebt,
          "Aylık Ödeme": data.summary.monthlyPayment,
          "Aktif Kredi Sayısı": data.summary.activeCredits,
          "Aktif Kart Sayısı": data.summary.activeCreditCards,
        },
      ]
    }

    return workbook
  }

  const generateCSVData = () => {
    const csvData: any = {}

    if (selectedData.credits) {
      csvData.credits = data.credits.map((credit) => ({
        bank: credit.banks?.name || "N/A",
        type: credit.credit_types?.name || "N/A",
        remaining_debt: credit.remaining_debt,
        monthly_payment: credit.monthly_payment,
        interest_rate: credit.interest_rate,
        status: credit.status,
      }))
    }

    if (selectedData.payments) {
      csvData.payments = data.payments.map((payment) => ({
        bank: payment.credits?.banks?.name || "N/A",
        due_date: payment.due_date,
        amount: payment.total_payment,
        status: payment.status,
      }))
    }

    return csvData
  }

  const generateJSONData = () => {
    const jsonData: any = {}

    if (selectedData.credits) jsonData.credits = data.credits
    if (selectedData.payments) jsonData.payments = data.payments
    if (selectedData.creditCards) jsonData.creditCards = data.creditCards
    if (selectedData.summary) jsonData.summary = data.summary

    return jsonData
  }

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)

    try {
      // Simulate export progress
      const steps = [
        { progress: 20, message: "Veriler hazırlanıyor..." },
        { progress: 40, message: "Format dönüştürülüyor..." },
        { progress: 60, message: "Dosya oluşturuluyor..." },
        { progress: 80, message: "Son kontroller..." },
        { progress: 100, message: "Tamamlandı!" },
      ]

      for (const step of steps) {
        setProgress(step.progress)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      let exportData
      let fileName
      let mimeType

      switch (exportFormat) {
        case "excel":
          exportData = generateExcelData()
          fileName = `finansal-rapor-${new Date().toISOString().split("T")[0]}.xlsx`
          mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          break
        case "csv":
          exportData = generateCSVData()
          fileName = `finansal-rapor-${new Date().toISOString().split("T")[0]}.csv`
          mimeType = "text/csv"
          break
        case "json":
          exportData = generateJSONData()
          fileName = `finansal-rapor-${new Date().toISOString().split("T")[0]}.json`
          mimeType = "application/json"
          break
        default:
          throw new Error("Desteklenmeyen format")
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: mimeType })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Başarılı",
        description: `Verileriniz ${exportFormat.toUpperCase()} formatında indirildi.`,
        variant: "default",
      })

      setOpen(false)
    } catch (error) {
      toast({
        title: "Export Hatası",
        description: "Veriler dışa aktarılırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }

  const selectedCount = Object.values(selectedData).filter(Boolean).length
  const totalRecords = Object.entries(selectedData)
    .filter(([_, selected]) => selected)
    .reduce((total, [key, _]) => {
      const dataType = dataTypes.find((dt) => dt.key === key)
      return total + (dataType?.count || 0)
    }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            Veri Dışa Aktarma
          </DialogTitle>
          <DialogDescription>Finansal verilerinizi farklı formatlarda dışa aktarın ve paylaşın.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar (when exporting) */}
          {exporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dışa aktarılıyor...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Dışa Aktarma Formatı</Label>
            <div className="grid grid-cols-1 gap-3">
              {exportFormats.map((format) => (
                <div
                  key={format.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    exportFormat === format.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportFormat(format.value)}
                >
                  <div className="flex items-center gap-3">
                    {format.icon}
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-gray-600">{format.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Dışa Aktarılacak Veriler</Label>
              <Badge variant="outline">{selectedCount} kategori seçili</Badge>
            </div>
            <div className="space-y-3">
              {dataTypes.map((dataType) => (
                <div key={dataType.key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <Checkbox
                    id={dataType.key}
                    checked={(selectedData as any)[dataType.key]}
                    onCheckedChange={() => handleDataToggle(dataType.key)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={dataType.key} className="font-medium cursor-pointer">
                      {dataType.label}
                    </Label>
                    <p className="text-sm text-gray-600">{dataType.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dataType.count} kayıt
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Dışa Aktarma Özeti</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium">{exportFormats.find((f) => f.value === exportFormat)?.label}</span>
              </div>
              <div>
                <span className="text-gray-600">Toplam Kayıt:</span>
                <span className="ml-2 font-medium">{totalRecords.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Kategori:</span>
                <span className="ml-2 font-medium">{selectedCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Tahmini Boyut:</span>
                <span className="ml-2 font-medium">{Math.ceil(totalRecords / 100)} KB</span>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ek Seçenekler</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" size="sm" className="justify-start bg-transparent">
                <Mail className="h-4 w-4 mr-2" />
                E-posta Gönder
              </Button>
              <Button variant="outline" size="sm" className="justify-start bg-transparent">
                <Cloud className="h-4 w-4 mr-2" />
                Buluta Kaydet
              </Button>
              <Button variant="outline" size="sm" className="justify-start bg-transparent">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobil Paylaş
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedCount === 0 ? "Lütfen en az bir kategori seçin" : `${totalRecords} kayıt dışa aktarılacak`}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
                İptal
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting || selectedCount === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Dışa Aktarılıyor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Dışa Aktar
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
