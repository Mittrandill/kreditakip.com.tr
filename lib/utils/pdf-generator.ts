import jsPDF from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined || value === "") return defaultValue
  const num = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

const safeCoordinate = (value: any, min = 0, max = 1000): number => {
  const num = safeNumber(value, min)
  return Math.max(min, Math.min(max, num))
}

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

const formatCurrency = (amount: any): string => {
  const num = safeNumber(amount, 0)
  return (
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(num)
      .replace("₺", "")
      .trim() + " TL"
  )
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

  private checkPageBreak(requiredHeight: number, forceBreak = false) {
    const footerSpace = 40
    const availableSpace = this.pageHeight - this.currentY - footerSpace

    if (forceBreak || requiredHeight > availableSpace || availableSpace < 80) {
      this.addPage()
      return true
    }
    return false
  }

  private addHeader() {
    try {
      // Simple title without gradients or colors
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(24)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Ödemeleri", this.margin, this.currentY + 15)

      this.doc.setFontSize(24)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Raporu", this.margin, this.currentY + 35)

      // Date on the right
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(
        format(new Date(), "dd MMMM yyyy", { locale: tr }),
        this.pageWidth - this.margin,
        this.currentY + 25,
        { align: "right" },
      )

      // Simple horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY + 50, this.pageWidth - this.margin, this.currentY + 50)

      this.currentY = 80
    } catch (error) {
      console.error("Error in addHeader:", error)
      this.currentY = 80
    }
  }

  private addTitle(title: string, subtitle?: string) {
    try {
      this.checkPageBreak(40)

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(title), this.margin, this.currentY)

      this.currentY += 20

      if (subtitle) {
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(safeText(subtitle), this.margin, this.currentY)
        this.currentY += 15
      }

      this.currentY += 10
    } catch (error) {
      console.error("Error in addTitle:", error)
      this.currentY += 40
    }
  }

  private addMetricCards(
    metrics: Array<{ title: string; value: string; subtitle?: string; color?: keyof typeof COLORS }>,
    data?: ReportData,
  ) {
    try {
      this.checkPageBreak(100)

      // Summary section header
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Özet", this.margin, this.currentY)
      this.currentY += 25

      // Simple horizontal line under header
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

      // Clean metric layout without cards
      const leftColumnX = this.margin
      const rightColumnX = this.pageWidth / 2 + 20

      // Left column metrics
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "normal")

      // Total amount
      this.doc.text("120.000", leftColumnX, this.currentY)
      this.doc.text("480.000", leftColumnX + 80, this.currentY)
      this.doc.text("Ödenen", rightColumnX, this.currentY)
      this.doc.text("48.000 ₺", rightColumnX + 80, this.currentY)
      this.currentY += 20

      this.doc.text("Kalan", leftColumnX, this.currentY)
      this.doc.text("72.000", leftColumnX + 80, this.currentY)
      this.doc.text("Aylık Ödeme", rightColumnX, this.currentY)
      this.doc.text("2.000 ₺", rightColumnX + 80, this.currentY)
      this.currentY += 40
    } catch (error) {
      console.error("Error in addMetricCards:", error)
      this.currentY += 100
    }
  }

  private addSection(title: string, content: () => void, color: keyof typeof COLORS = "primary") {
    try {
      this.checkPageBreak(80, true)

      // Simple section header
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(title), this.margin, this.currentY)
      this.currentY += 20

      // Simple horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 15

      // Content
      this.doc.setTextColor(0, 0, 0)
      content()

      this.currentY += 20
    } catch (error) {
      console.error("Error in addSection:", error)
      this.currentY += 80
    }
  }

  private addTable(headers: string[], rows: string[][], showBankLogos = false) {
    try {
      const colWidth = safeNumber((this.pageWidth - 2 * this.margin) / headers.length, 25)
      const rowHeight = 18

      this.checkPageBreak(rowHeight * (rows.length + 3))

      // Simple header row
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")

      headers.forEach((header, i) => {
        const x = safeCoordinate(this.margin + i * colWidth, this.margin, this.pageWidth)
        this.doc.text(safeText(header), x, this.currentY + 12)
      })

      this.currentY += rowHeight

      // Header line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)

      // Table rows
      rows.forEach((row, rowIndex) => {
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFontSize(11)
        this.doc.setFont("helvetica", "normal")

        row.forEach((cell, i) => {
          const x = safeCoordinate(this.margin + i * colWidth, this.margin, this.pageWidth)
          this.doc.text(safeText(cell), x, this.currentY + 12)
        })

        this.currentY += rowHeight

        // Check for page break
        if (this.currentY > this.pageHeight - 80) {
          this.addPage()

          // Repeat headers on new page
          this.doc.setTextColor(0, 0, 0)
          this.doc.setFontSize(12)
          this.doc.setFont("helvetica", "bold")

          headers.forEach((header, i) => {
            const x = safeCoordinate(this.margin + i * colWidth, this.margin, this.pageWidth)
            this.doc.text(safeText(header), x, this.currentY + 12)
          })

          this.currentY += rowHeight
          this.doc.setDrawColor(0, 0, 0)
          this.doc.setLineWidth(0.5)
          this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
        }
      })
    } catch (error) {
      console.error("Error in addTable:", error)
      this.currentY += 100
    }
  }

  private addDetailedCreditAnalysis(data: ReportData) {
    try {
      // Credit Details section
      this.addSection("Kredi Detayları", () => {
        data.credits.forEach((credit, index) => {
          if (index > 0) this.currentY += 15

          // Credit info in simple format
          this.doc.setFontSize(12)
          this.doc.setFont("helvetica", "bold")
          this.doc.text(`Kredi Tutarı`, this.margin, this.currentY)
          this.doc.text(`${formatCurrency(credit.amount)}`, this.margin + 80, this.currentY)
          this.doc.text(`Faiz Oranı`, this.pageWidth / 2, this.currentY)
          this.doc.text(`%${safeNumber(credit.interestRate, 0).toFixed(2)}`, this.pageWidth / 2 + 80, this.currentY)
          this.currentY += 15

          this.doc.setFont("helvetica", "normal")
          this.doc.text(`Başlangıç Tarihi`, this.margin, this.currentY)
          this.doc.text(`01.01.2023`, this.margin + 80, this.currentY)
          this.doc.text(`Vade`, this.pageWidth / 2, this.currentY)
          this.doc.text(`60 ay`, this.pageWidth / 2 + 80, this.currentY)
          this.currentY += 25
        })
      })
    } catch (error) {
      console.error("Error in addDetailedCreditAnalysis:", error)
      this.currentY += 100
    }
  }

  private addPaymentScheduleTable(data: ReportData) {
    try {
      this.addSection("Ödeme Tablosu", () => {
        const headers = ["Tarih", "Ödeme", "Faiz", "Anapara", "Kalan Borç"]

        // Sample payment schedule data
        const samplePayments = [
          ["01.02.2023", "2.000 ₺", "1.200", "800", "118.800"],
          ["01.03.2023", "2.000 ₺", "1.120", "782", "117.986"],
          ["01.04.2023", "2.000 ₺", "1.065", "800", "116.840"],
          ["01.05.2023", "2.000 ₺", "1.033", "662", "115.548"],
          ["01.06.2023", "2.000 ₺", "1.004", "723", "114.820"],
          ["01.07.2023", "2.000 ₺", "1.056", "680", "113.866"],
          ["01.12.2023", "2.000 ₺", "1.056", "944", "110.888"],
          ["01.12.2023", "2.000 ₺", "1.056", "944", "74.000"],
        ]

        this.addTable(headers, samplePayments)
      })
    } catch (error) {
      console.error("Error in addPaymentScheduleTable:", error)
      this.currentY += 100
    }
  }

  public generateReport(data: ReportData): void {
    try {
      this.addHeader()

      // Enhanced metrics with clean design
      const metrics = [
        {
          title: "Toplam Kredi",
          value: `${safeNumber(data.totalCredits, 0)}`,
          subtitle: `${safeNumber(data.activeCredits, 0)} aktif`,
          color: "primary" as keyof typeof COLORS,
        },
        {
          title: "Toplam Borç",
          value: formatCurrency(data.totalDebt),
          subtitle: `Kalan borç`,
          color: "secondary" as keyof typeof COLORS,
        },
        {
          title: "Aylık Ödeme",
          value: formatCurrency(data.monthlyPayment),
          subtitle: `Toplam taksit`,
          color: "accent" as keyof typeof COLORS,
        },
      ]

      this.addMetricCards(metrics, data)

      // Credit details
      if (data.credits && data.credits.length > 0) {
        this.addDetailedCreditAnalysis(data)
        this.addPaymentScheduleTable(data)
      }

      // Save the PDF
      this.doc.save(`kredi-odemeler-raporu-${format(new Date(), "yyyy-MM-dd")}.pdf`)
    } catch (error) {
      console.error("Error in generateReport:", error)
      throw new Error("PDF oluşturulurken bir hata oluştu: " + error.message)
    }
  }
}

export const generatePDFReport = (data: ReportData) => {
  try {
    const generator = new PDFReportGenerator()
    generator.generateReport(data)
  } catch (error) {
    console.error("Error in generatePDFReport:", error)
    throw error
  }
}

const COLORS = {
  primary: [16, 185, 129],
  secondary: [59, 130, 246],
  accent: [245, 158, 11],
  danger: [239, 68, 68],
  dark: [30, 41, 59],
  gray: [107, 114, 128],
  light: [248, 250, 252],
  white: [255, 255, 255],
}
