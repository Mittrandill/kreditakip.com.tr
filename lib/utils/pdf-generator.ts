import jsPDF from "jspdf"
import { format } from "date-fns"

const removeTurkishChars = (text: string): string => {
  if (!text || typeof text !== "string") return ""

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
    // Additional characters that might cause issues
    ë: "e",
    Ë: "E",
    ï: "i",
    Ï: "I",
    ô: "o",
    Ô: "O",
    ù: "u",
    Ù: "U",
    à: "a",
    À: "A",
    è: "e",
    È: "E",
    é: "e",
    É: "E",
    ê: "e",
    Ê: "E",
  }

  return text.replace(/[çğıöşüÇĞİÖŞÜâîûÂÎÛëïôùàèéêËÏÔÙÀÈÉÊ]/g, (match) => charMap[match] || match)
}

const safeText = (text: any): string => {
  if (text === null || text === undefined) return ""
  return removeTurkishChars(String(text))
}

const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return "0"
  return `${Math.round(amount).toLocaleString("en-US")} TL`
}

const getBankColor = (bankName: string): [number, number, number] => {
  const colors: [number, number, number][] = [
    [16, 185, 129], // Emerald
    [59, 130, 246], // Blue
    [147, 51, 234], // Purple
    [245, 158, 11], // Amber
    [239, 68, 68], // Red
    [34, 197, 94], // Green
    [14, 165, 233], // Sky
    [234, 179, 8], // Yellow
    [217, 70, 239], // Fuchsia
    [20, 184, 166], // Teal
  ]

  let hash = 0
  for (let i = 0; i < bankName.length; i++) {
    const char = bankName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return colors[Math.abs(hash) % colors.length]
}

const getBankInitials = (bankName: string): string => {
  return bankName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
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
    remainingInstallments?: number
    totalInstallments?: number
    startDate?: string | Date
    endDate?: string | Date
    paidAmount?: number
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
  includeSections?: {
    summary?: boolean
    creditDetails?: boolean
    paymentSchedule?: boolean
    interestAnalysis?: boolean
    riskAssessment?: boolean
  }
  chartOptions?: {
    paymentTrend?: boolean
    debtDistribution?: boolean
    bankComparison?: boolean
    interestComparison?: boolean
    paymentProgress?: boolean
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

  private addBankLogo(x: number, y: number, bankName: string, size = 8) {
    const color = getBankColor(bankName)
    const initials = getBankInitials(bankName)

    // Draw colored circle
    this.doc.setFillColor(...color)
    this.doc.circle(x + size / 2, y + size / 2, size / 2, "F")

    // Add initials
    this.doc.setTextColor(255, 255, 255) // Pure white for maximum contrast
    this.doc.setFontSize(size * 0.4)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(initials, x + size / 2, y + size / 2 + 1, { align: "center" })
  }

  private addTitle(title: string, subtitle?: string) {
    this.checkPageBreak(40)

    // Main title
    this.doc.setFontSize(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(0, 0, 0) // Pure black
    this.doc.text(safeText(title), this.pageWidth / 2, this.currentY, { align: "center" })
    this.currentY += 12

    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(75, 85, 99) // Gray-600 for good contrast
      this.doc.text(safeText(subtitle), this.pageWidth / 2, this.currentY, { align: "center" })
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
      this.doc.text(safeText(metric.value), x + cardWidth / 2, this.currentY + 20, { align: "center" })

      // Title
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(0, 0, 0) // Pure black
      this.doc.text(safeText(metric.title), x + cardWidth / 2, this.currentY + 30, { align: "center" })

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(7)
        this.doc.setTextColor(75, 85, 99) // Gray-600
        this.doc.text(safeText(metric.subtitle), x + cardWidth / 2, this.currentY + 38, { align: "center" })
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

    this.doc.setTextColor(255, 255, 255) // Pure white
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + 8, sectionY + 10)

    this.currentY = sectionY + 25

    // Content area
    this.doc.setTextColor(0, 0, 0) // Pure black
    content()

    this.currentY += 15
  }

  private addTable(
    headers: string[],
    rows: string[][],
    options?: {
      headerColor?: keyof typeof COLORS
      alternateRows?: boolean
      bankNames?: string[]
    },
  ) {
    const opts = { headerColor: "primary" as keyof typeof COLORS, alternateRows: true, ...options }
    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length
    const rowHeight = 12 // Increased for logo space

    this.checkPageBreak((rows.length + 2) * rowHeight)

    // Header
    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")

    this.doc.setTextColor(255, 255, 255) // Pure white
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")

    headers.forEach((header, i) => {
      this.doc.text(safeText(header), this.margin + i * colWidth + 3, this.currentY + 8)
    })

    this.currentY += rowHeight

    // Rows
    this.doc.setTextColor(0, 0, 0) // Pure black
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(8)

    rows.forEach((row, rowIndex) => {
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(...COLORS.light)
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")
      }

      row.forEach((cell, colIndex) => {
        // If this is the first column (bank name) and we have bank names, add logo
        if (colIndex === 0 && opts.bankNames && opts.bankNames[rowIndex]) {
          this.addBankLogo(this.margin + colIndex * colWidth + 3, this.currentY + 2, opts.bankNames[rowIndex], 8)
          this.doc.setTextColor(0, 0, 0) // Pure black
          this.doc.text(safeText(cell), this.margin + colIndex * colWidth + 15, this.currentY + 8)
        } else {
          this.doc.setTextColor(0, 0, 0) // Pure black
          this.doc.text(safeText(cell), this.margin + colIndex * colWidth + 3, this.currentY + 8)
        }
      })

      this.currentY += rowHeight

      if (this.currentY > this.pageHeight - 50) {
        this.addPage()
      }
    })

    this.currentY += 10
  }

  public generateReport(data: ReportData): void {
    try {
      console.log("PDF generation started with data:", data)

      // Header
      this.addHeader()

      const reportDate = format(new Date(), "dd/MM/yyyy")

      // Title
      this.addTitle(data.reportTitle || "Kredi Portfoy Raporu", `Rapor Tarihi: ${reportDate}`)

      // User info section
      this.addSection("Kullanici Bilgileri", () => {
        this.doc.setFontSize(10)
        this.doc.setTextColor(0, 0, 0) // Pure black
        this.doc.text(`Ad Soyad: ${safeText(data.userData.name)}`, this.margin + 10, this.currentY)
        this.currentY += 8
        this.doc.text(`E-posta: ${safeText(data.userData.email)}`, this.margin + 10, this.currentY)
        this.currentY += 8

        if (data.period) {
          let periodText = ""
          switch (data.period.type) {
            case "thisMonth":
              periodText = "Bu Ay"
              break
            case "last3Months":
              periodText = "Son 3 Ay"
              break
            case "last6Months":
              periodText = "Son 6 Ay"
              break
            case "thisYear":
              periodText = "Bu Yil"
              break
            case "custom":
              periodText =
                data.period.from && data.period.to
                  ? `${format(data.period.from, "dd/MM/yyyy")} - ${format(data.period.to, "dd/MM/yyyy")}`
                  : "Ozel Tarih Araligi"
              break
            default:
              periodText = "Tum Zamanlar"
          }
          this.doc.text(`Rapor Donemi: ${safeText(periodText)}`, this.margin + 10, this.currentY)
          this.currentY += 8
        }

        if (data.includeSections) {
          const selectedSections = Object.entries(data.includeSections)
            .filter(([_, value]) => value)
            .map(([key, _]) => {
              switch (key) {
                case "summary":
                  return "Genel Ozet"
                case "creditDetails":
                  return "Kredi Detaylari"
                case "paymentSchedule":
                  return "Odeme Plani"
                case "interestAnalysis":
                  return "Faiz Analizi"
                case "riskAssessment":
                  return "Risk Degerlendirmesi"
                default:
                  return key
              }
            })

          if (selectedSections.length > 0) {
            this.doc.text(`Dahil Edilen Bolumler: ${selectedSections.join(", ")}`, this.margin + 10, this.currentY)
            this.currentY += 8
          }
        }

        if (data.chartOptions) {
          const selectedCharts = Object.entries(data.chartOptions)
            .filter(([_, value]) => value)
            .map(([key, _]) => {
              switch (key) {
                case "paymentTrend":
                  return "Odeme Trendi"
                case "debtDistribution":
                  return "Borc Dagilimi"
                case "bankComparison":
                  return "Banka Karsilastirmasi"
                case "interestComparison":
                  return "Faiz Karsilastirmasi"
                case "paymentProgress":
                  return "Odeme Ilerlemesi"
                default:
                  return key
              }
            })

          if (selectedCharts.length > 0) {
            this.doc.text(`Dahil Edilen Grafikler: ${selectedCharts.join(", ")}`, this.margin + 10, this.currentY)
            this.currentY += 8
          }
        }
      })

      if (!data.includeSections || data.includeSections.summary !== false) {
        const metrics = [
          {
            title: "Toplam Kredi",
            value: data.totalCredits.toString(),
            subtitle: `${data.activeCredits} aktif`,
            color: "secondary" as keyof typeof COLORS,
          },
          {
            title: "Toplam Borc",
            value: formatCurrency(data.totalDebt),
            subtitle: "Kalan borc",
            color: "danger" as keyof typeof COLORS,
          },
          {
            title: "Aylik Odeme",
            value: formatCurrency(data.monthlyPayment),
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
      }

      if (
        (!data.includeSections || data.includeSections.creditDetails !== false) &&
        data.credits &&
        data.credits.length > 0
      ) {
        this.addSection("Kredi Detaylari", () => {
          this.doc.setFontSize(9)
          this.doc.text("Detayli Kredi Bilgileri:", this.margin + 10, this.currentY)
          this.currentY += 10

          // Main credit details table
          const headers = ["Banka", "Kredi Turu", "Kalan Borc", "Aylik Odeme", "Faiz Orani", "Durum"]
          const rows = data.credits
            .slice(0, 15)
            .map((credit) => [
              safeText(credit.bankName) || "Bilinmeyen",
              safeText(credit.creditType) || "Diger",
              formatCurrency(credit.remainingDebt || 0),
              formatCurrency(credit.monthlyPayment || 0),
              `%${(credit.interestRate || 0).toFixed(2)}`,
              credit.status === "active" ? "Aktif" : "Kapali",
            ])

          const bankNames = data.credits.slice(0, 15).map((credit) => credit.bankName)
          this.addTable(headers, rows, { bankNames })

          // Detailed breakdown for each credit
          this.currentY += 10
          this.doc.setFontSize(10)
          this.doc.setFont("helvetica", "bold")
          this.doc.text("Kredi Bazinda Detayli Analiz:", this.margin + 10, this.currentY)
          this.currentY += 15

          data.credits.slice(0, 10).forEach((credit, index) => {
            this.checkPageBreak(80)

            // Credit card header
            this.doc.setFillColor(245, 245, 245)
            this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 2, 2, "F")

            // Bank logo and name
            this.addBankLogo(this.margin + 5, this.currentY + 2, credit.bankName, 8)
            this.doc.setTextColor(0, 0, 0)
            this.doc.setFontSize(10)
            this.doc.setFont("helvetica", "bold")
            this.doc.text(
              `${safeText(credit.bankName)} - ${safeText(credit.creditType)}`,
              this.margin + 18,
              this.currentY + 8,
            )

            this.currentY += 20

            // Calculate additional metrics
            const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
            const yearlyInterest = monthlyInterest * 12
            const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
            const paymentProgress = credit.amount ? ((paidAmount / credit.amount) * 100).toFixed(1) : "0"
            const remainingMonths = credit.monthlyPayment
              ? Math.ceil((credit.remainingDebt || 0) / credit.monthlyPayment)
              : 0

            // Two column layout for details
            const leftColX = this.margin + 10
            const rightColX = this.margin + (this.pageWidth - 2 * this.margin) / 2 + 10
            let detailY = this.currentY

            this.doc.setFontSize(8)
            this.doc.setFont("helvetica", "normal")

            // Left column
            this.doc.setFont("helvetica", "bold")
            this.doc.text("Finansal Bilgiler:", leftColX, detailY)
            detailY += 8

            this.doc.setFont("helvetica", "normal")
            this.doc.text(`Baslangic Tutari: ${formatCurrency(credit.amount || 0)}`, leftColX, detailY)
            detailY += 6
            this.doc.text(`Kalan Borc: ${formatCurrency(credit.remainingDebt || 0)}`, leftColX, detailY)
            detailY += 6
            this.doc.text(`Odenen Tutar: ${formatCurrency(paidAmount)}`, leftColX, detailY)
            detailY += 6
            this.doc.text(`Odeme Orani: %${paymentProgress}`, leftColX, detailY)
            detailY += 6
            this.doc.text(`Aylik Odeme: ${formatCurrency(credit.monthlyPayment || 0)}`, leftColX, detailY)
            detailY += 10

            this.doc.setFont("helvetica", "bold")
            this.doc.text("Faiz Bilgileri:", leftColX, detailY)
            detailY += 8

            this.doc.setFont("helvetica", "normal")
            this.doc.text(`Faiz Orani: %${(credit.interestRate || 0).toFixed(2)}`, leftColX, detailY)
            detailY += 6
            this.doc.text(`Aylik Faiz: ${formatCurrency(monthlyInterest)}`, leftColX, detailY)
            detailY += 6
            this.doc.text(`Yillik Faiz: ${formatCurrency(yearlyInterest)}`, leftColX, detailY)

            // Right column
            detailY = this.currentY
            this.doc.setFont("helvetica", "bold")
            this.doc.text("Taksit Bilgileri:", rightColX, detailY)
            detailY += 8

            this.doc.setFont("helvetica", "normal")
            if (credit.totalInstallments) {
              const paidInstallments = (credit.totalInstallments || 0) - (credit.remainingInstallments || 0)
              this.doc.text(`Toplam Taksit: ${credit.totalInstallments}`, rightColX, detailY)
              detailY += 6
              this.doc.text(`Odenen Taksit: ${paidInstallments}`, rightColX, detailY)
              detailY += 6
              this.doc.text(`Kalan Taksit: ${credit.remainingInstallments || 0}`, rightColX, detailY)
            } else {
              this.doc.text(`Tahmini Kalan Ay: ${remainingMonths}`, rightColX, detailY)
              detailY += 6
              this.doc.text("Taksit bilgisi mevcut degil", rightColX, detailY)
            }
            detailY += 10

            this.doc.setFont("helvetica", "bold")
            this.doc.text("Tarih Bilgileri:", rightColX, detailY)
            detailY += 8

            this.doc.setFont("helvetica", "normal")
            if (credit.startDate) {
              const startDate = new Date(credit.startDate)
              this.doc.text(`Baslangic: ${format(startDate, "dd/MM/yyyy")}`, rightColX, detailY)
              detailY += 6
            }
            if (credit.endDate) {
              const endDate = new Date(credit.endDate)
              this.doc.text(`Bitis: ${format(endDate, "dd/MM/yyyy")}`, rightColX, detailY)
              detailY += 6
            }
            if (!credit.startDate && !credit.endDate) {
              this.doc.text("Tarih bilgisi mevcut degil", rightColX, detailY)
              detailY += 6
            }

            this.doc.text(`Durum: ${credit.status === "active" ? "Aktif" : "Kapali"}`, rightColX, detailY)

            this.currentY = Math.max(detailY, this.currentY + 60) + 15

            // Add separator line
            if (index < Math.min(data.credits.length - 1, 9)) {
              this.doc.setDrawColor(200, 200, 200)
              this.doc.setLineWidth(0.5)
              this.doc.line(this.margin, this.currentY - 5, this.pageWidth - this.margin, this.currentY - 5)
            }
          })
        })
      }

      if (data.includeSections?.paymentSchedule && data.credits && data.credits.length > 0) {
        this.addSection("Odeme Plani", () => {
          this.doc.setFontSize(9)
          this.doc.text("Aylik Odeme Dagilimi:", this.margin + 10, this.currentY)
          this.currentY += 10

          const headers = ["Banka", "Kredi Turu", "Aylik Odeme", "Yillik Toplam"]
          const activeCredits = data.credits.filter((credit) => credit.status === "active")
          const rows = activeCredits.map((credit) => [
            safeText(credit.bankName) || "Bilinmeyen",
            safeText(credit.creditType) || "Diger",
            formatCurrency(credit.monthlyPayment || 0),
            formatCurrency((credit.monthlyPayment || 0) * 12),
          ])

          const bankNames = activeCredits.map((credit) => credit.bankName)

          this.addTable(headers, rows, { bankNames })
        })
      }

      if (data.includeSections?.interestAnalysis && data.credits && data.credits.length > 0) {
        this.addSection("Faiz Analizi", () => {
          this.doc.setFontSize(9)

          const avgInterestRate =
            data.credits.reduce((sum, credit) => sum + (credit.interestRate || 0), 0) / data.credits.length
          const totalMonthlyInterest = data.credits.reduce((sum, credit) => {
            return sum + ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
          }, 0)
          const totalYearlyInterest = totalMonthlyInterest * 12

          this.doc.text(`Ortalama Faiz Orani: %${avgInterestRate.toFixed(2)}`, this.margin + 10, this.currentY)
          this.currentY += 8
          this.doc.text(`Aylik Toplam Faiz: ${formatCurrency(totalMonthlyInterest)}`, this.margin + 10, this.currentY)
          this.currentY += 8
          this.doc.text(`Yillik Toplam Faiz: ${formatCurrency(totalYearlyInterest)}`, this.margin + 10, this.currentY)
          this.currentY += 8

          // Interest burden analysis
          const totalDebt = data.credits.reduce((sum, credit) => sum + (credit.remainingDebt || 0), 0)
          const interestBurdenRatio = totalDebt > 0 ? (totalYearlyInterest / totalDebt) * 100 : 0
          this.doc.text(`Faiz Yuk Orani: %${interestBurdenRatio.toFixed(2)}`, this.margin + 10, this.currentY)
          this.currentY += 15

          const headers = ["Banka", "Kredi Turu", "Faiz Orani", "Kalan Borc", "Aylik Faiz", "Yillik Faiz"]
          const rows = data.credits.map((credit) => {
            const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
            return [
              safeText(credit.bankName) || "Bilinmeyen",
              safeText(credit.creditType) || "Diger",
              `%${(credit.interestRate || 0).toFixed(2)}`,
              formatCurrency(credit.remainingDebt || 0),
              formatCurrency(monthlyInterest),
              formatCurrency(monthlyInterest * 12),
            ]
          })

          const bankNames = data.credits.map((credit) => credit.bankName)

          this.addTable(headers, rows, { bankNames })
        })
      }

      if (data.includeSections?.riskAssessment && data.credits && data.credits.length > 0) {
        this.addSection("Risk Degerlendirmesi", () => {
          this.doc.setFontSize(9)

          const debtToIncomeRatio = data.monthlyPayment / Math.max(data.monthlyPayment * 3, 1) // Assuming 3x payment as income
          const highInterestCredits = data.credits.filter((c) => (c.interestRate || 0) > 20).length
          const totalCreditsCount = data.credits.length

          let riskLevel = "Dusuk"
          let riskColor = "accent"

          if (debtToIncomeRatio > 0.4 || highInterestCredits > totalCreditsCount / 2) {
            riskLevel = "Yuksek"
            riskColor = "danger"
          } else if (debtToIncomeRatio > 0.25 || highInterestCredits > 0) {
            riskLevel = "Orta"
            riskColor = "secondary"
          }

          this.doc.text(`Genel Risk Seviyesi: ${riskLevel}`, this.margin + 10, this.currentY)
          this.currentY += 8
          this.doc.text(`Yuksek Faizli Kredi Sayisi: ${highInterestCredits}`, this.margin + 10, this.currentY)
          this.currentY += 8
          this.doc.text(`Toplam Kredi Sayisi: ${totalCreditsCount}`, this.margin + 10, this.currentY)
          this.currentY += 15

          const riskFactors = [
            "• Yuksek faizli kredileri oncelikle kapatmayi dusunun",
            "• Aylik odeme yukunu azaltmak icin refinansman seceneklerini arastirin",
            "• Acil durum fonu olusturarak finansal guvenliginizi artirin",
            "• Kredi kartlarinizdaki bakiyeleri minimize etmeye calisin",
            "• Duzenli olarak kredi raporlarinizi kontrol edin",
          ]

          riskFactors.forEach((factor) => {
            this.doc.text(safeText(factor), this.margin + 10, this.currentY)
            this.currentY += 6
          })
        })
      }

      if (data.chartOptions?.debtDistribution && data.chartData?.creditDistribution) {
        this.addSection("Borc Dagilim Analizi", () => {
          this.doc.setFontSize(9)
          this.doc.text("Bankalara Gore Borc Dagilimi:", this.margin + 10, this.currentY)
          this.currentY += 10

          const headers = ["Banka", "Toplam Borc", "Kredi Sayisi", "Oran"]
          const totalDebt = data.chartData!.creditDistribution!.reduce((sum: number, item: any) => sum + item.value, 0)

          const rows = data.chartData.creditDistribution.map((item: any) => [
            safeText(item.name),
            formatCurrency(item.value),
            item.count.toString(),
            `%${((item.value / totalDebt) * 100).toFixed(1)}`,
          ])

          this.addTable(headers, rows)
        })
      }

      if (data.chartOptions?.bankComparison && data.chartData?.bankDistribution) {
        this.addSection("Banka Karsilastirmasi", () => {
          this.doc.setFontSize(9)
          this.doc.text("Banka Bazinda Detayli Karsilastirma:", this.margin + 10, this.currentY)
          this.currentY += 10

          const headers = ["Banka", "Toplam Borc", "Pazar Payi"]
          const totalAmount = data.chartData!.bankDistribution!.reduce((sum: number, item: any) => sum + item.amount, 0)

          const rows = data.chartData.bankDistribution.map((item: any) => [
            safeText(item.bank),
            formatCurrency(item.amount),
            `%${((item.amount / totalAmount) * 100).toFixed(1)}`,
          ])

          this.addTable(headers, rows)
        })
      }

      // Recommendations
      this.addSection(
        "Oneriler ve Degerlendirme",
        () => {
          this.doc.setFontSize(9)
          const suggestions = [
            "• Yuksek faizli kredileri oncelikle kapatmayi dusunun",
            "• Aylik odeme yukunu azaltmak icin refinansman seceneklerini arastirin",
            "• Acil durum fonu olusturarak finansal guvenliginizi artirin",
            "• Kredi kartlarinizdaki bakiyeleri minimize etmeye calisin",
            "• Duzenli olarak kredi raporlarinizi kontrol edin",
          ]

          suggestions.forEach((suggestion) => {
            this.doc.text(safeText(suggestion), this.margin + 10, this.currentY)
            this.currentY += 6
          })
        },
        "accent",
      )

      // Footer
      this.doc.setFontSize(7)
      this.doc.setTextColor(75, 85, 99) // Gray-600
      this.doc.text(
        "Bu rapor KrediTakip tarafindan otomatik olarak olusturulmustur.",
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: "center" },
      )

      // Save PDF
      const fileName = `kredi-raporu-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
      console.log("Saving PDF with filename:", fileName)
      this.doc.save(fileName)
      console.log("PDF saved successfully")
    } catch (error) {
      console.error("PDF generation error:", error)
      throw new Error("PDF olusturulurken bir hata olustu: " + (error as Error).message)
    }
  }
}

export const generatePDFReport = (data: ReportData) => {
  try {
    console.log("generatePDFReport called with:", data)
    const generator = new PDFReportGenerator()
    generator.generateReport(data)
  } catch (error) {
    console.error("Error in generatePDFReport:", error)
    throw error
  }
}

const COLORS = {
  primary: [16, 185, 129], // Emerald-500
  secondary: [59, 130, 246], // Blue-500
  accent: [245, 158, 11], // Amber-500
  danger: [239, 68, 68], // Red-500
  dark: [0, 0, 0], // Black for maximum contrast
  gray: [107, 114, 128], // Gray-500
  light: [249, 250, 251], // Gray-50
  white: [255, 255, 255],
}
