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
  primary: [16, 185, 129], // Emerald-500
  secondary: [59, 130, 246], // Blue-500
  accent: [245, 158, 11], // Amber-500
  danger: [239, 68, 68], // Red-500
  dark: [31, 41, 55], // Gray-800
  gray: [107, 114, 128], // Gray-500
  light: [249, 250, 251], // Gray-50
  white: [255, 255, 255],
}

export interface ReportData {
  reportTitle?: string
  period?: {
    from?: Date
    to?: Date
    type?: string
  }
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
  credits: Array<{
    id: string
    bankName: string
    creditType: string
    remainingDebt: number
    monthlyPayment: number
    interestRate: number
    status: string
    amount: number
  }>
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

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = this.margin
    this.addHeader()
  }

  private checkPageBreak(requiredHeight: number) {
    if (this.currentY + requiredHeight > this.pageHeight - 30) {
      this.addPage()
    }
  }

  private addHeader() {
    // Modern header with gradient effect
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(0, 0, this.pageWidth, 25, "F")

    // Logo area
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(25, 12.5, 8, "F")

    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", 25, 15, { align: "center" })

    // Title
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDITAKIP", 40, 16)

    // Subtitle
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Finansal Rapor Sistemi", 40, 21)

    // Page number
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(10)
    this.doc.text(`Sayfa ${this.pageNumber}`, this.pageWidth - this.margin, 16, { align: "right" })

    this.currentY = 35
  }

  private addTitle(title: string, subtitle?: string) {
    this.checkPageBreak(40)

    // Main title
    this.doc.setFontSize(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.text(removeTurkishChars(title), this.pageWidth / 2, this.currentY, { align: "center" })
    this.currentY += 12

    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(removeTurkishChars(subtitle), this.pageWidth / 2, this.currentY, { align: "center" })
      this.currentY += 8
    }

    // Decorative line
    this.doc.setDrawColor(...COLORS.primary)
    this.doc.setLineWidth(2)
    this.doc.line(this.pageWidth / 2 - 30, this.currentY + 5, this.pageWidth / 2 + 30, this.currentY + 5)

    this.currentY += 20
  }

  private addMetricCards(
    metrics: Array<{ title: string; value: string; subtitle?: string; color?: keyof typeof COLORS }>,
  ) {
    this.checkPageBreak(80)

    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 50

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10)
      const color = COLORS[metric.color || "primary"]

      // Card background with shadow effect
      this.doc.setFillColor(255, 255, 255)
      this.doc.setDrawColor(230, 230, 230)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 3, 3, "FD")

      // Color accent bar
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 3, "F")

      // Value
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...color)
      this.doc.text(removeTurkishChars(metric.value), x + cardWidth / 2, this.currentY + 20, { align: "center" })

      // Title
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(removeTurkishChars(metric.title), x + cardWidth / 2, this.currentY + 30, { align: "center" })

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(7)
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(removeTurkishChars(metric.subtitle), x + cardWidth / 2, this.currentY + 38, { align: "center" })
      }
    })

    this.currentY += cardHeight + 20
  }

  private addSection(title: string, content: () => void, color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(80)

    const sectionY = this.currentY

    // Section header
    this.doc.setFillColor(...COLORS[color])
    this.doc.roundedRect(this.margin, sectionY, this.pageWidth - 2 * this.margin, 15, 2, 2, "F")

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(removeTurkishChars(title), this.margin + 8, sectionY + 10)

    this.currentY = sectionY + 25

    // Content area
    this.doc.setTextColor(...COLORS.dark)
    content()

    this.currentY += 15
  }

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
    const rowHeight = 10

    this.checkPageBreak((rows.length + 2) * rowHeight)

    // Header
    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")

    headers.forEach((header, i) => {
      this.doc.text(removeTurkishChars(header), this.margin + i * colWidth + 3, this.currentY + 7)
    })

    this.currentY += rowHeight

    // Rows
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(8)

    rows.forEach((row, rowIndex) => {
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(...COLORS.light)
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")
      }

      row.forEach((cell, colIndex) => {
        this.doc.text(removeTurkishChars(cell), this.margin + colIndex * colWidth + 3, this.currentY + 7)
      })

      this.currentY += rowHeight

      if (this.currentY > this.pageHeight - 50) {
        this.addPage()
      }
    })

    this.currentY += 10
  }

  private addChartPlaceholder(title: string, data: any[], type: "bar" | "pie" | "line" = "bar") {
    this.checkPageBreak(100)

    const chartHeight = 80
    const chartWidth = this.pageWidth - 2 * this.margin

    // Title
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.text(removeTurkishChars(title), this.margin, this.currentY)
    this.currentY += 15

    // Chart area
    this.doc.setDrawColor(...COLORS.gray)
    this.doc.setFillColor(...COLORS.light)
    this.doc.roundedRect(this.margin, this.currentY, chartWidth, chartHeight, 3, 3, "FD")

    // Simple visualization
    if (type === "bar" && data.length > 0) {
      const maxValue = Math.max(...data.map((d) => d.value || d.amount || 0))
      const barWidth = (chartWidth / Math.min(data.length, 8)) * 0.7
      const barSpacing = (chartWidth / Math.min(data.length, 8)) * 0.3

      data.slice(0, 8).forEach((item, index) => {
        const value = item.value || item.amount || 0
        const barHeight = maxValue > 0 ? (value / maxValue) * (chartHeight - 20) : 0
        const x = this.margin + index * (barWidth + barSpacing) + barSpacing / 2
        const y = this.currentY + chartHeight - barHeight - 10

        this.doc.setFillColor(...COLORS.primary)
        this.doc.roundedRect(x, y, barWidth, barHeight, 1, 1, "F")

        // Value label
        if (barHeight > 10) {
          this.doc.setFontSize(6)
          this.doc.setTextColor(...COLORS.white)
          this.doc.text(value.toLocaleString("tr-TR"), x + barWidth / 2, y + barHeight / 2, { align: "center" })
        }
      })
    }

    this.currentY += chartHeight + 15
  }

  public generateReport(data: ReportData): void {
    try {
      // Header
      this.addHeader()

      // Title
      this.addTitle(
        data.reportTitle || "Kredi Portföy Raporu",
        `Rapor Tarihi: ${format(new Date(), "dd MMMM yyyy", { locale: tr })}`,
      )

      // User info section
      this.addSection("Kullanıcı Bilgileri", () => {
        this.doc.setFontSize(10)
        this.doc.text(`Ad Soyad: ${removeTurkishChars(data.userData.name)}`, this.margin + 10, this.currentY)
        this.currentY += 8
        this.doc.text(`E-posta: ${data.userData.email}`, this.margin + 10, this.currentY)
        this.currentY += 8

        if (data.period) {
          const periodText =
            data.period.from && data.period.to
              ? `${format(data.period.from, "dd/MM/yyyy")} - ${format(data.period.to, "dd/MM/yyyy")}`
              : data.period.type || "Tüm zamanlar"
          this.doc.text(`Rapor Dönemi: ${removeTurkishChars(periodText)}`, this.margin + 10, this.currentY)
        }
      })

      // Summary metrics
      const metrics = [
        {
          title: "Toplam Kredi",
          value: data.totalCredits.toString(),
          subtitle: `${data.activeCredits} aktif`,
          color: "secondary" as keyof typeof COLORS,
        },
        {
          title: "Toplam Borç",
          value: `₺${data.totalDebt.toLocaleString("tr-TR")}`,
          subtitle: "Kalan borç",
          color: "danger" as keyof typeof COLORS,
        },
        {
          title: "Aylık Ödeme",
          value: `₺${data.monthlyPayment.toLocaleString("tr-TR")}`,
          subtitle: "Toplam taksit",
          color: "primary" as keyof typeof COLORS,
        },
        {
          title: "Aktif Oran",
          value: `%${Math.round((data.activeCredits / Math.max(data.totalCredits, 1)) * 100)}`,
          subtitle: "Aktif krediler",
          color: "accent" as keyof typeof COLORS,
        },
      ]

      this.addMetricCards(metrics)

      // Credits table
      if (data.credits && data.credits.length > 0) {
        this.addSection("Kredi Detayları", () => {
          const headers = ["Banka", "Kredi Türü", "Kalan Borç", "Aylık Ödeme", "Faiz", "Durum"]
          const rows = data.credits
            .slice(0, 15)
            .map((credit) => [
              credit.bankName || "Bilinmeyen",
              credit.creditType || "Diğer",
              `₺${(credit.remainingDebt || 0).toLocaleString("tr-TR")}`,
              `₺${(credit.monthlyPayment || 0).toLocaleString("tr-TR")}`,
              `%${credit.interestRate || 0}`,
              credit.status === "active" ? "Aktif" : "Kapalı",
            ])

          this.addTable(headers, rows)
        })
      }

      // Charts
      if (data.chartData) {
        if (data.chartData.bankDistribution) {
          this.addChartPlaceholder("Banka Dağılımı", data.chartData.bankDistribution, "bar")
        }

        if (data.chartData.monthlyPayments) {
          this.addChartPlaceholder("Aylık Ödeme Trendi", data.chartData.monthlyPayments, "line")
        }
      }

      // Recommendations
      this.addSection(
        "Öneriler ve Değerlendirme",
        () => {
          this.doc.setFontSize(9)
          const suggestions = [
            "• Yüksek faizli kredileri öncelikle kapatmayı düşünün",
            "• Aylık ödeme yükünü azaltmak için refinansman seçeneklerini araştırın",
            "• Acil durum fonu oluşturarak finansal güvenliğinizi artırın",
            "• Kredi kartlarınızdaki bakiyeleri minimize etmeye çalışın",
            "• Düzenli olarak kredi raporlarınızı kontrol edin",
          ]

          suggestions.forEach((suggestion) => {
            this.doc.text(removeTurkishChars(suggestion), this.margin + 10, this.currentY)
            this.currentY += 6
          })
        },
        "accent",
      )

      // Footer
      this.doc.setFontSize(7)
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(
        "Bu rapor KrediTakip tarafından otomatik olarak oluşturulmuştur.",
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: "center" },
      )

      // Save PDF
      const fileName = `kredi-raporu-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
      this.doc.save(fileName)
    } catch (error) {
      console.error("PDF generation error:", error)
      throw new Error("PDF oluşturulurken bir hata oluştu")
    }
  }
}

export const generatePDFReport = (data: ReportData) => {
  const generator = new PDFReportGenerator()
  generator.generateReport(data)
}
