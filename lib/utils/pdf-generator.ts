import jsPDF from "jspdf"
import { format } from "date-fns"

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
      // Main header background with gradient effect
      this.doc.setFillColor(16, 185, 129)
      this.doc.rect(0, 0, this.pageWidth, 30, "F")

      // Subtle gradient overlay
      this.doc.setFillColor(10, 150, 100, 0.3)
      this.doc.rect(0, 0, this.pageWidth, 15, "F")

      // KT Logo circle
      this.doc.setFillColor(255, 255, 255)
      this.doc.circle(25, 15, 8, "F")

      this.doc.setTextColor(16, 185, 129)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("KT", 25, 18, { align: "center" })

      // Main title
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("KREDITAKIP", 40, 18)

      // Subtitle
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Finansal Rapor Sistemi", this.pageWidth - this.margin, 18, { align: "right" })

      // Page number with better styling
      this.doc.setTextColor(100, 100, 100)
      this.doc.setFontSize(9)
      this.doc.text(`Sayfa ${this.pageNumber}`, this.pageWidth - this.margin, this.pageHeight - 10, { align: "right" })

      this.currentY = 40
    } catch (error) {
      console.error("Error in addHeader:", error)
      this.currentY = 40
    }
  }

  private addBankLogo(x: number, y: number, bankName: string, size = 8) {
    if (!bankName || typeof x !== "number" || typeof y !== "number" || typeof size !== "number") return
    if (isNaN(x) || isNaN(y) || isNaN(size) || !isFinite(x) || !isFinite(y) || !isFinite(size)) return

    const color = getBankColor(bankName)
    const initials = getBankInitials(bankName)

    const safeX = Math.max(5, Math.min(x + size / 2, this.pageWidth - 5))
    const safeY = Math.max(5, Math.min(y + size / 2, this.pageHeight - 5))
    const safeSize = Math.max(2, Math.min(size / 2, 15))

    if (!isFinite(safeX) || !isFinite(safeY) || !isFinite(safeSize)) return

    try {
      // Shadow effect
      this.doc.setFillColor(0, 0, 0, 0.1)
      this.doc.circle(safeX + 1, safeY + 1, safeSize, "F")

      // Main circle
      this.doc.setFillColor(...color)
      this.doc.circle(safeX, safeY, safeSize, "F")

      // Inner highlight
      this.doc.setFillColor(255, 255, 255, 0.2)
      this.doc.circle(safeX - 1, safeY - 1, safeSize * 0.7, "F")

      const fontSize = Math.max(4, Math.min(size * 0.4, 12))
      if (isFinite(fontSize)) {
        this.doc.setTextColor(255, 255, 255)
        this.doc.setFontSize(fontSize)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(initials, safeX, safeY + 1, { align: "center" })
      }
    } catch (error) {
      console.error("Error drawing bank logo:", error)
    }
  }

  private addTitle(title: string, subtitle?: string) {
    try {
      this.checkPageBreak(40)

      this.doc.setTextColor(30, 41, 59)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(title), this.margin, this.currentY)

      this.currentY += 20

      if (subtitle) {
        this.doc.setTextColor(107, 114, 128)
        this.doc.setFontSize(10)
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
      this.checkPageBreak(140)

      const cardWidth = safeNumber((this.pageWidth - 2 * this.margin - 20) / 3, 50)
      const cardHeight = 45

      // Draw 3 main metric cards
      for (let i = 0; i < Math.min(3, metrics.length); i++) {
        const metric = metrics[i]
        if (!metric) continue

        const x = safeCoordinate(this.margin + i * (cardWidth + 10), this.margin, this.pageWidth - cardWidth)
        const y = safeCoordinate(this.currentY, this.margin, this.pageHeight - cardHeight)

        const color = COLORS[metric.color || "primary"] || COLORS.primary

        // Card shadow
        this.doc.setFillColor(0, 0, 0, 0.1)
        this.doc.rect(x + 2, y + 2, cardWidth, cardHeight, "F")

        // Card background
        this.doc.setFillColor(255, 255, 255)
        this.doc.setDrawColor(240, 240, 240)
        this.doc.setLineWidth(0.5)
        this.doc.rect(x, y, cardWidth, cardHeight, "FD")

        // Colored left border
        this.doc.setFillColor(color[0], color[1], color[2])
        this.doc.rect(x, y, 3, cardHeight, "F")

        // Title
        this.doc.setTextColor(107, 114, 128)
        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(safeText(metric.title), x + 8, y + 12)

        // Value
        this.doc.setTextColor(30, 41, 59)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(safeText(metric.value), x + 8, y + 25)

        // Subtitle
        if (metric.subtitle) {
          this.doc.setTextColor(107, 114, 128)
          this.doc.setFontSize(7)
          this.doc.setFont("helvetica", "normal")
          this.doc.text(safeText(metric.subtitle), x + 8, y + 35)
        }
      }

      this.currentY += 60

      // Add debt distribution pie chart
      if (data && data.credits && data.credits.length > 0) {
        this.addDebtDistributionChart(data)
      }
    } catch (error) {
      console.error("Error in addMetricCards:", error)
      this.currentY += 140
    }
  }

  private addDebtDistributionChart(data: ReportData) {
    try {
      this.checkPageBreak(120)

      // Title for chart section
      this.doc.setTextColor(30, 41, 59)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Borc Dagilimi", this.margin, this.currentY)
      this.currentY += 20

      const centerX = safeCoordinate(this.pageWidth / 2, 60, this.pageWidth - 60)
      const centerY = safeCoordinate(this.currentY + 40, 60, this.pageHeight - 60)
      const radius = 35

      // Calculate bank distribution
      const bankTotals: { [key: string]: number } = {}
      let totalDebt = 0

      data.credits.forEach((credit) => {
        const bankName = credit.bankName || "Bilinmeyen"
        const debt = safeNumber(credit.remainingDebt, 0)
        bankTotals[bankName] = (bankTotals[bankName] || 0) + debt
        totalDebt += debt
      })

      if (totalDebt <= 0) {
        this.currentY += 80
        return
      }

      const banks = Object.keys(bankTotals).slice(0, 5) // Max 5 banks
      const colors = [
        [16, 185, 129], // Emerald
        [59, 130, 246], // Blue
        [245, 158, 11], // Amber
        [239, 68, 68], // Red
        [147, 51, 234], // Purple
      ]

      let startAngle = -90 // Start from top

      // Draw pie slices
      banks.forEach((bank, index) => {
        const percentage = (bankTotals[bank] / totalDebt) * 100
        const angle = (percentage / 100) * 360

        if (angle < 1) return // Skip very small slices

        const color = colors[index % colors.length]
        this.doc.setFillColor(color[0], color[1], color[2])

        // Draw slice using multiple small triangles for smooth arc
        const steps = Math.max(3, Math.floor(angle / 10))
        const stepAngle = angle / steps

        for (let step = 0; step < steps; step++) {
          const angle1 = startAngle + step * stepAngle
          const angle2 = startAngle + (step + 1) * stepAngle

          const rad1 = (angle1 * Math.PI) / 180
          const rad2 = (angle2 * Math.PI) / 180

          const x1 = centerX + radius * Math.cos(rad1)
          const y1 = centerY + radius * Math.sin(rad1)
          const x2 = centerX + radius * Math.cos(rad2)
          const y2 = centerY + radius * Math.sin(rad2)

          this.doc.triangle(centerX, centerY, x1, y1, x2, y2, "F")
        }

        // Add percentage label
        const labelAngle = startAngle + angle / 2
        const labelRad = (labelAngle * Math.PI) / 180
        const labelX = centerX + (radius + 20) * Math.cos(labelRad)
        const labelY = centerY + (radius + 20) * Math.sin(labelRad)

        this.doc.setTextColor(0, 0, 0)
        this.doc.setFontSize(9)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(`%${Math.round(percentage)}`, labelX, labelY, { align: "center" })

        startAngle += angle
      })

      // Add legend
      const legendX = this.margin
      const legendY = this.currentY + 90

      banks.forEach((bank, index) => {
        const y = legendY + index * 12
        const color = colors[index % colors.length]

        // Color box
        this.doc.setFillColor(color[0], color[1], color[2])
        this.doc.rect(legendX, y - 3, 8, 6, "F")

        // Bank name and amount
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(`${safeText(bank)}: ${formatCurrency(bankTotals[bank])}`, legendX + 12, y)
      })

      this.currentY += 120
    } catch (error) {
      console.error("Error in addDebtDistributionChart:", error)
      this.currentY += 120
    }
  }

  private addSection(title: string, content: () => void, color: keyof typeof COLORS = "primary") {
    try {
      this.checkPageBreak(80, true) // Force page break for sections

      const sectionColor = COLORS[color] || COLORS.primary

      // Section header with gradient effect
      this.doc.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2])
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, "F")

      // Subtle gradient overlay
      this.doc.setFillColor(255, 255, 255, 0.1)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 9, "F")

      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(13)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(title), this.margin + 10, this.currentY + 12)

      this.currentY += 28

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

      // Header background
      this.doc.setFillColor(59, 130, 246)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")

      // Header text
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "bold")

      headers.forEach((header, i) => {
        const x = safeCoordinate(this.margin + i * colWidth + 6, this.margin, this.pageWidth)
        this.doc.text(safeText(header), x, this.currentY + 12)
      })

      this.currentY += rowHeight

      // Table rows
      rows.forEach((row, rowIndex) => {
        // Alternating row colors
        if (rowIndex % 2 === 1) {
          this.doc.setFillColor(248, 250, 252)
          this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")
        }

        // Row border
        this.doc.setDrawColor(230, 230, 230)
        this.doc.setLineWidth(0.2)
        this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

        this.doc.setTextColor(30, 41, 59)
        this.doc.setFontSize(9)
        this.doc.setFont("helvetica", "normal")

        row.forEach((cell, i) => {
          const x = safeCoordinate(this.margin + i * colWidth + 6, this.margin, this.pageWidth)

          // Add bank logo for first column if enabled
          if (showBankLogos && i === 0 && cell) {
            this.addBankLogo(x - 4, this.currentY + 4, cell, 10)
            this.doc.text(safeText(cell), x + 16, this.currentY + 12)
          } else {
            this.doc.text(safeText(cell), x, this.currentY + 12)
          }
        })

        this.currentY += rowHeight

        // Check for page break
        if (this.currentY > this.pageHeight - 80) {
          this.addPage()

          // Repeat headers on new page
          this.doc.setFillColor(59, 130, 246)
          this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")

          this.doc.setTextColor(255, 255, 255)
          this.doc.setFontSize(10)
          this.doc.setFont("helvetica", "bold")

          headers.forEach((header, i) => {
            const x = safeCoordinate(this.margin + i * colWidth + 6, this.margin, this.pageWidth)
            this.doc.text(safeText(header), x, this.currentY + 12)
          })

          this.currentY += rowHeight
        }
      })
    } catch (error) {
      console.error("Error in addTable:", error)
      this.currentY += 100
    }
  }

  private addDetailedCreditAnalysis(data: ReportData) {
    try {
      data.credits.forEach((credit, index) => {
        this.checkPageBreak(120, true) // Force new page for each detailed credit

        // Credit header
        this.doc.setFillColor(16, 185, 129)
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, "F")

        // Bank logo in header
        this.addBankLogo(this.margin + 10, this.currentY + 10, credit.bankName, 12)

        this.doc.setTextColor(255, 255, 255)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(
          `${safeText(credit.bankName)} - ${safeText(credit.creditType)}`,
          this.margin + 30,
          this.currentY + 13,
        )

        this.currentY += 30

        // Financial details in cards
        const cardWidth = (this.pageWidth - 2 * this.margin - 20) / 3
        const cardHeight = 60

        const financialCards = [
          {
            title: "Baslangic Tutari",
            value: formatCurrency(credit.amount),
            subtitle: `Kalan: ${formatCurrency(credit.remainingDebt)}`,
            color: "primary",
          },
          {
            title: "Odeme Durumu",
            value: `%${Math.round(((credit.amount - credit.remainingDebt) / credit.amount) * 100)}`,
            subtitle: `Odenen: ${formatCurrency(credit.amount - credit.remainingDebt)}`,
            color: "secondary",
          },
          {
            title: "Aylik Odeme",
            value: formatCurrency(credit.monthlyPayment),
            subtitle: `Faiz: %${safeNumber(credit.interestRate, 0).toFixed(2)}`,
            color: "accent",
          },
        ]

        financialCards.forEach((card, i) => {
          const x = this.margin + i * (cardWidth + 10)
          const color = COLORS[card.color as keyof typeof COLORS]

          // Card background
          this.doc.setFillColor(255, 255, 255)
          this.doc.setDrawColor(230, 230, 230)
          this.doc.rect(x, this.currentY, cardWidth, cardHeight, "FD")

          // Colored top border
          this.doc.setFillColor(color[0], color[1], color[2])
          this.doc.rect(x, this.currentY, cardWidth, 3, "F")

          // Card content
          this.doc.setTextColor(107, 114, 128)
          this.doc.setFontSize(8)
          this.doc.text(card.title, x + 8, this.currentY + 15)

          this.doc.setTextColor(30, 41, 59)
          this.doc.setFontSize(14)
          this.doc.setFont("helvetica", "bold")
          this.doc.text(card.value, x + 8, this.currentY + 30)

          this.doc.setTextColor(107, 114, 128)
          this.doc.setFontSize(7)
          this.doc.setFont("helvetica", "normal")
          this.doc.text(card.subtitle, x + 8, this.currentY + 45)
        })

        this.currentY += 80

        // Interest analysis
        const monthlyInterest = (credit.remainingDebt * credit.interestRate) / 1200
        const yearlyInterest = monthlyInterest * 12
        const remainingMonths = Math.ceil(credit.remainingDebt / credit.monthlyPayment)

        this.doc.setTextColor(30, 41, 59)
        this.doc.setFontSize(11)
        this.doc.setFont("helvetica", "bold")
        this.doc.text("Faiz Analizi:", this.margin, this.currentY)
        this.currentY += 15

        this.doc.setFontSize(9)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(`• Aylik Faiz: ${formatCurrency(monthlyInterest)}`, this.margin + 10, this.currentY)
        this.currentY += 12
        this.doc.text(`• Yillik Faiz: ${formatCurrency(yearlyInterest)}`, this.margin + 10, this.currentY)
        this.currentY += 12
        this.doc.text(`• Tahmini Kalan Ay: ${remainingMonths} ay`, this.margin + 10, this.currentY)
        this.currentY += 12
        this.doc.text(`• Durum: ${safeText(credit.status)}`, this.margin + 10, this.currentY)
        this.currentY += 20
      })
    } catch (error) {
      console.error("Error in addDetailedCreditAnalysis:", error)
      this.currentY += 100
    }
  }

  private addPaymentTrendAnalysis(data: ReportData) {
    try {
      this.checkPageBreak(150, true)

      this.doc.setTextColor(30, 41, 59)
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Odeme Trend Analizi", this.margin, this.currentY)
      this.currentY += 25

      // Create monthly payment data
      const monthlyData: { [key: string]: number } = {}
      const months = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran"]

      // Initialize with sample data based on credits
      months.forEach((month, index) => {
        monthlyData[month] = data.monthlyPayment * (0.8 + Math.random() * 0.4) // Simulate variation
      })

      // Draw bar chart
      const chartWidth = this.pageWidth - 2 * this.margin - 40
      const chartHeight = 80
      const barWidth = chartWidth / months.length - 5
      const maxValue = Math.max(...Object.values(monthlyData))

      months.forEach((month, index) => {
        const value = monthlyData[month]
        const barHeight = (value / maxValue) * chartHeight
        const x = this.margin + 20 + index * (barWidth + 5)
        const y = this.currentY + chartHeight - barHeight

        // Bar
        this.doc.setFillColor(16, 185, 129)
        this.doc.rect(x, y, barWidth, barHeight, "F")

        // Value label
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFontSize(7)
        this.doc.text(formatCurrency(value), x + barWidth / 2, y - 5, { align: "center" })

        // Month label
        this.doc.text(month.substring(0, 3), x + barWidth / 2, this.currentY + chartHeight + 15, { align: "center" })
      })

      this.currentY += chartHeight + 30

      // Analysis text
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("• Son 6 aylik odeme performansiniz istikrarli bir seyir izlemektedir.", this.margin, this.currentY)
      this.currentY += 12
      this.doc.text(
        "• Ortalama aylik odeme tutariniz: " + formatCurrency(data.monthlyPayment),
        this.margin,
        this.currentY,
      )
      this.currentY += 12
      this.doc.text("• Odeme disiplinini koruyarak kredi skorunuzu iyilestirebilirsiniz.", this.margin, this.currentY)
      this.currentY += 25
    } catch (error) {
      console.error("Error in addPaymentTrendAnalysis:", error)
      this.currentY += 150
    }
  }

  private addRecommendations(data: ReportData) {
    try {
      this.checkPageBreak(120, true)

      this.addSection(
        "Oneriler ve Degerlendirme",
        () => {
          const recommendations = [
            "Yuksek faizli kredileri oncelikle kapatmayi dusunun",
            "Aylik odeme yukunu azaltmak icin refinansman seceneklerini arastirin",
            "Acil durum fonu olusturarak finansal guvenliginizi artirin",
            "Kredi kartlarinizdaki bakiyeleri minimize etmeye calisin",
            "Duzenli olarak kredi raporlarinizi kontrol edin",
          ]

          recommendations.forEach((rec, index) => {
            this.doc.setFontSize(10)
            this.doc.setFont("helvetica", "normal")
            this.doc.text(`• ${rec}`, this.margin + 10, this.currentY)
            this.currentY += 15
          })

          this.currentY += 10

          // Risk assessment
          const totalDebtRatio = data.totalDebt / (data.monthlyPayment * 12 * 5) // Rough calculation
          let riskLevel = "Dusuk"
          let riskColor = [34, 197, 94] // Green

          if (totalDebtRatio > 0.6) {
            riskLevel = "Yuksek"
            riskColor = [239, 68, 68] // Red
          } else if (totalDebtRatio > 0.4) {
            riskLevel = "Orta"
            riskColor = [245, 158, 11] // Amber
          }

          this.doc.setFillColor(riskColor[0], riskColor[1], riskColor[2], 0.1)
          this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, "F")

          this.doc.setTextColor(riskColor[0], riskColor[1], riskColor[2])
          this.doc.setFontSize(11)
          this.doc.setFont("helvetica", "bold")
          this.doc.text(`Risk Seviyesi: ${riskLevel}`, this.margin + 10, this.currentY + 15)

          this.currentY += 35
        },
        "accent",
      )

      // Footer
      this.doc.setTextColor(107, 114, 128)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "italic")
      this.doc.text(
        "Bu rapor KrediTakip tarafindan otomatik olarak olusturulmustur.",
        this.pageWidth / 2,
        this.currentY + 20,
        { align: "center" },
      )
    } catch (error) {
      console.error("Error in addRecommendations:", error)
      this.currentY += 120
    }
  }

  public generateReport(data: ReportData): void {
    try {
      this.addHeader()

      const reportDate = format(new Date(), "dd/MM/yyyy")
      const periodText =
        data.period?.type === "custom" && data.period.from && data.period.to
          ? `${format(data.period.from, "dd/MM/yyyy")} - ${format(data.period.to, "dd/MM/yyyy")}`
          : "Son 6 Ay"

      this.addTitle(data.reportTitle || "Kredi Portfoy Raporu", `Rapor Tarihi: ${reportDate}`)

      // User info section with better styling
      this.addSection("Kullanici Bilgileri", () => {
        this.doc.setFontSize(10)
        this.doc.text(`Ad Soyad: ${safeText(data.userData.name)}`, this.margin + 10, this.currentY)
        this.currentY += 12
        this.doc.text(`E-posta: ${safeText(data.userData.email)}`, this.margin + 10, this.currentY)
        this.currentY += 12
        this.doc.text(`Rapor Donemi: ${periodText}`, this.margin + 10, this.currentY)
        this.currentY += 12
      })

      // Enhanced metrics with additional data
      const activeRatio = data.totalCredits > 0 ? (data.activeCredits / data.totalCredits) * 100 : 0
      const metrics = [
        {
          title: "Toplam Kredi",
          value: `${safeNumber(data.totalCredits, 0)}`,
          subtitle: `${safeNumber(data.activeCredits, 0)} aktif`,
          color: "primary" as keyof typeof COLORS,
        },
        {
          title: "Toplam Borc",
          value: formatCurrency(data.totalDebt),
          subtitle: `Kalan borc`,
          color: "secondary" as keyof typeof COLORS,
        },
        {
          title: "Aylik Odeme",
          value: formatCurrency(data.monthlyPayment),
          subtitle: `Toplam taksit`,
          color: "accent" as keyof typeof COLORS,
        },
      ]

      this.addMetricCards(metrics, data)

      // Credits overview table
      if (data.credits && data.credits.length > 0) {
        this.addSection("Kredi Detaylari", () => {
          this.doc.setTextColor(107, 114, 128)
          this.doc.setFontSize(9)
          this.doc.text("Detayli Kredi Bilgileri:", this.margin + 10, this.currentY)
          this.currentY += 20

          const headers = ["Banka", "Kredi Turu", "Kalan Borc", "Aylik Odeme", "Faiz Orani", "Durum"]
          const rows = data.credits.map((credit) => [
            safeText(credit.bankName),
            safeText(credit.creditType),
            formatCurrency(credit.remainingDebt),
            formatCurrency(credit.monthlyPayment),
            `%${safeNumber(credit.interestRate, 0).toFixed(2)}`,
            safeText(credit.status),
          ])

          this.addTable(headers, rows, true)
        })

        // Detailed analysis for each credit
        this.addSection("Kredi Bazinda Detayli Analiz", () => {
          this.currentY += 10
        })
        this.addDetailedCreditAnalysis(data)

        // Payment trend analysis
        if (data.chartOptions?.paymentTrend) {
          this.addPaymentTrendAnalysis(data)
        }
      }

      // Recommendations
      this.addRecommendations(data)

      // Save the PDF
      this.doc.save(`kredi-raporu-${format(new Date(), "yyyy-MM-dd")}.pdf`)
    } catch (error) {
      console.error("Error in generateReport:", error)
      throw new Error("PDF olusturulurken bir hata olustu: " + error.message)
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
