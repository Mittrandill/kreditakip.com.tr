import jsPDF from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// Türkçe karakterleri temizleme
const removeTurkishChars = (text: string): string => {
  const charMap: { [key: string]: string } = {
    ç: "c",
    Ç: "C",
    ğ: "g",
    Ğ: "G",
    ı: "i",
    İ: "I",
    ö: "o",
    Ö: "O",
    ş: "s",
    Ş: "S",
    ü: "u",
    Ü: "U",
    â: "a",
    Â: "A",
    î: "i",
    Î: "I",
    û: "u",
    Û: "U",
  }
  return text.replace(/[çğıöşüÇĞİÖŞÜâîûÂÎÛ]/g, (match) => charMap[match] || match)
}

// Renk paleti
const COLORS = {
  primary: [59, 130, 246],
  secondary: [16, 185, 129],
  accent: [245, 158, 11],
  danger: [239, 68, 68],
  dark: [31, 41, 55],
  gray: [107, 114, 128],
  light: [249, 250, 251],
  white: [255, 255, 255],
}

// Banka logoları ve renkleri
const getBankInfo = (bankName: string) => {
  const bankMap: { [key: string]: { color: number[]; short: string } } = {
    "Ziraat Bankasi": { color: [0, 166, 81], short: "ZB" },
    "Garanti BBVA": { color: [0, 160, 223], short: "GB" },
    "Is Bankasi": { color: [0, 84, 166], short: "IB" },
    Akbank: { color: [227, 30, 36], short: "AB" },
    "Yapi Kredi": { color: [255, 205, 0], short: "YK" },
    Halkbank: { color: [0, 166, 81], short: "HB" },
    VakifBank: { color: [31, 78, 121], short: "VB" },
    DenizBank: { color: [255, 102, 0], short: "DB" },
    "Kuveyt Turk": { color: [0, 166, 81], short: "KT" },
    "Turkiye Finans": { color: [0, 166, 81], short: "TF" },
  }
  return bankMap[bankName] || { color: [107, 114, 128], short: bankName.slice(0, 2).toUpperCase() }
}

export interface ReportData {
  userData: {
    name: string
    email: string
  }
  totalCredits: number
  activeCredits: number
  closedCredits: number
  totalDebt: number
  totalPayment: number
  monthlyPayment: number
  credits: any[]
  selectedReports?: string[]
  chartData?: {
    monthlyPayments?: any[]
    creditDistribution?: any[]
    interestAnalysis?: any[]
    paymentCalendar?: any[]
    bankDistribution?: any[]
    paymentTrend?: any[]
  }
  selectedBanks?: string[]
  reportTitle?: string
  period?: {
    from?: Date
    to?: Date
    type?: string
  }
}

class PDFReportGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private pageNumber: number

  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
    this.pageNumber = 1
  }

  // Yeni sayfa ekleme
  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = this.margin
    this.addHeader()
  }

  // Sayfa kontrolü
  private checkPageBreak(requiredHeight: number) {
    if (this.currentY + requiredHeight > this.pageHeight - 30) {
      this.addPage()
    }
  }

  // Header ekleme
  private addHeader() {
    // Logo ve başlık
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(this.pageWidth / 2 - 25, 10, 50, 15, "F")

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDITAKIP", this.pageWidth / 2, 20, { align: "center" })

    // Sayfa numarası
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Sayfa ${this.pageNumber}`, this.pageWidth - this.margin, 15, { align: "right" })

    this.currentY = 35
  }

  // Başlık ekleme
  private addTitle(title: string, subtitle?: string) {
    this.checkPageBreak(30)

    this.doc.setFontSize(24)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.text(removeTurkishChars(title), this.pageWidth / 2, this.currentY, { align: "center" })

    this.currentY += 15

    if (subtitle) {
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(removeTurkishChars(subtitle), this.pageWidth / 2, this.currentY, { align: "center" })
      this.currentY += 10
    }

    this.currentY += 10
  }

  // Kart ekleme
  private addCard(title: string, content: () => void, color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(60)

    const cardHeight = 50
    const cardY = this.currentY

    // Kart arka planı
    this.doc.setFillColor(...COLORS.light)
    this.doc.roundedRect(this.margin, cardY, this.pageWidth - 2 * this.margin, cardHeight, 3, 3, "F")

    // Kart başlığı
    this.doc.setFillColor(...COLORS[color])
    this.doc.roundedRect(this.margin, cardY, this.pageWidth - 2 * this.margin, 12, 3, 3, "F")

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(removeTurkishChars(title), this.margin + 10, cardY + 8)

    // İçerik alanı
    this.currentY = cardY + 20
    this.doc.setTextColor(...COLORS.dark)
    content()

    this.currentY = cardY + cardHeight + 10
  }

  // Metrik kartları
  private addMetricCards(metrics: Array<{ title: string; value: string; subtitle?: string }>) {
    this.checkPageBreak(80)

    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 60

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10)

      // Kart arka planı
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(...COLORS.gray)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 5, 5, "FD")

      // Değer
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.primary)
      this.doc.text(removeTurkishChars(metric.value), x + cardWidth / 2, this.currentY + 25, { align: "center" })

      // Başlık
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(removeTurkishChars(metric.title), x + cardWidth / 2, this.currentY + 35, { align: "center" })

      // Alt başlık
      if (metric.subtitle) {
        this.doc.setFontSize(8)
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(removeTurkishChars(metric.subtitle), x + cardWidth / 2, this.currentY + 45, { align: "center" })
      }
    })

    this.currentY += cardHeight + 20
  }

  // Tablo ekleme
  private addTable(
    headers: string[],
    rows: string[][],
    options?: {
      headerColor?: keyof typeof COLORS
      alternateRows?: boolean
    },
  ) {
    const opts = { headerColor: "primary" as keyof typeof COLORS, alternateRows: true, ...options }
    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length
    const rowHeight = 12

    this.checkPageBreak((rows.length + 2) * rowHeight)

    // Başlık satırı
    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")

    headers.forEach((header, i) => {
      this.doc.text(removeTurkishChars(header), this.margin + i * colWidth + 5, this.currentY + 8)
    })

    this.currentY += rowHeight

    // Veri satırları
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "normal")

    rows.forEach((row, rowIndex) => {
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(...COLORS.light)
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")
      }

      row.forEach((cell, colIndex) => {
        this.doc.text(removeTurkishChars(cell), this.margin + colIndex * colWidth + 5, this.currentY + 8)
      })

      this.currentY += rowHeight

      // Sayfa kontrolü
      if (this.currentY > this.pageHeight - 50) {
        this.addPage()
      }
    })

    this.currentY += 10
  }

  // Grafik placeholder ekleme
  private addChartPlaceholder(title: string, data: any[], type: "bar" | "pie" | "line" = "bar") {
    this.checkPageBreak(120)

    const chartHeight = 100
    const chartWidth = this.pageWidth - 2 * this.margin

    // Başlık
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.text(removeTurkishChars(title), this.margin, this.currentY)
    this.currentY += 15

    // Grafik alanı
    this.doc.setDrawColor(...COLORS.gray)
    this.doc.setFillColor(...COLORS.light)
    this.doc.rect(this.margin, this.currentY, chartWidth, chartHeight, "FD")

    // Basit grafik çizimi
    if (type === "bar" && data.length > 0) {
      const maxValue = Math.max(...data.map((d) => d.value || d.amount || 0))
      const barWidth = (chartWidth / data.length) * 0.8
      const barSpacing = (chartWidth / data.length) * 0.2

      data.slice(0, 8).forEach((item, index) => {
        const value = item.value || item.amount || 0
        const barHeight = (value / maxValue) * (chartHeight - 20)
        const x = this.margin + index * (barWidth + barSpacing) + barSpacing / 2
        const y = this.currentY + chartHeight - barHeight - 10

        this.doc.setFillColor(...COLORS.primary)
        this.doc.rect(x, y, barWidth, barHeight, "F")

        // Değer etiketi
        this.doc.setFontSize(8)
        this.doc.setTextColor(...COLORS.dark)
        this.doc.text(value.toLocaleString("tr-TR"), x + barWidth / 2, y - 2, { align: "center" })

        // X ekseni etiketi
        const label = item.name || item.bank || item.month || `Item ${index + 1}`
        this.doc.text(removeTurkishChars(label.slice(0, 8)), x + barWidth / 2, this.currentY + chartHeight + 8, {
          align: "center",
        })
      })
    }

    this.currentY += chartHeight + 20
  }

  // Ana rapor oluşturma
  public generateReport(data: ReportData): void {
    // Header
    this.addHeader()

    // Başlık
    this.addTitle(
      data.reportTitle || "Kredi Portfoy Raporu",
      `Rapor Tarihi: ${format(new Date(), "dd MMMM yyyy", { locale: tr })}`,
    )

    // Kullanıcı bilgileri
    this.addCard("Kullanici Bilgileri", () => {
      this.doc.setFontSize(11)
      this.doc.text(`Ad Soyad: ${removeTurkishChars(data.userData.name)}`, this.margin + 10, this.currentY)
      this.currentY += 8
      this.doc.text(`E-posta: ${data.userData.email}`, this.margin + 10, this.currentY)
      this.currentY += 8

      if (data.period) {
        const periodText =
          data.period.from && data.period.to
            ? `${format(data.period.from, "dd/MM/yyyy")} - ${format(data.period.to, "dd/MM/yyyy")}`
            : data.period.type || "Tum zamanlar"
        this.doc.text(`Rapor Donemi: ${removeTurkishChars(periodText)}`, this.margin + 10, this.currentY)
      }
    })

    // Özet metrikleri
    const metrics = [
      { title: "Toplam Kredi", value: data.totalCredits.toString(), subtitle: `${data.activeCredits} aktif` },
      { title: "Toplam Borc", value: `${data.totalDebt.toLocaleString("tr-TR")} TL`, subtitle: "Kalan borc" },
      { title: "Aylik Odeme", value: `${data.monthlyPayment.toLocaleString("tr-TR")} TL`, subtitle: "Toplam taksit" },
      {
        title: "Odeme Orani",
        value: `%${Math.round((data.activeCredits / data.totalCredits) * 100)}`,
        subtitle: "Aktif oran",
      },
    ]

    this.addMetricCards(metrics)

    // Kredi detayları tablosu
    if (data.credits && data.credits.length > 0) {
      const headers = ["Banka", "Kredi Turu", "Kalan Borc", "Aylik Odeme", "Faiz", "Durum"]
      const rows = data.credits
        .slice(0, 15)
        .map((credit) => [
          credit.bankName || "Bilinmeyen",
          credit.creditType || "Diger",
          `${(credit.remainingDebt || 0).toLocaleString("tr-TR")} TL`,
          `${(credit.monthlyPayment || 0).toLocaleString("tr-TR")} TL`,
          `%${credit.interestRate || 0}`,
          credit.status === "active" ? "Aktif" : "Kapali",
        ])

      this.addTable(headers, rows)
    }

    // Grafikler
    if (data.chartData) {
      if (data.chartData.bankDistribution) {
        this.addChartPlaceholder("Banka Dagilimi", data.chartData.bankDistribution, "bar")
      }

      if (data.chartData.monthlyPayments) {
        this.addChartPlaceholder("Aylik Odeme Trendi", data.chartData.monthlyPayments, "line")
      }

      if (data.chartData.creditDistribution) {
        this.addChartPlaceholder("Kredi Turu Dagilimi", data.chartData.creditDistribution, "pie")
      }
    }

    // Öneriler bölümü
    this.addCard(
      "Oneriler ve Degerlendirme",
      () => {
        this.doc.setFontSize(10)
        const suggestions = [
          "• Yuksek faizli kredileri oncelikle kapatmayi dusunun",
          "• Aylik odeme yukunu azaltmak icin refinansman seceneklerini arastirin",
          "• Acil durum fonu olusturarak finansal guvenliginizi artirin",
          "• Kredi kartlarinizdaki bakiyeleri minimize etmeye calisin",
          "• Duzenli olarak kredi raporlarinizi kontrol edin",
        ]

        suggestions.forEach((suggestion) => {
          this.doc.text(removeTurkishChars(suggestion), this.margin + 10, this.currentY)
          this.currentY += 8
        })
      },
      "secondary",
    )

    // Footer
    this.doc.setFontSize(8)
    this.doc.setTextColor(...COLORS.gray)
    this.doc.text(
      "Bu rapor KrediTakip tarafindan otomatik olarak olusturulmustur.",
      this.pageWidth / 2,
      this.pageHeight - 15,
      { align: "center" },
    )

    // PDF'i kaydet
    const fileName = `kredi-raporu-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
    this.doc.save(fileName)
  }
}

export const generatePDFReport = (data: ReportData) => {
  const generator = new PDFReportGenerator()
  generator.generateReport(data)
}

// Detaylı kredi raporu için ayrı fonksiyon
export const generateDetailedCreditReport = (creditData: any) => {
  const generator = new PDFReportGenerator()
  // Detaylı kredi raporu implementasyonu...
  // Bu fonksiyon tek bir kredinin detaylı analizini içerir
}
