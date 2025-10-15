import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// Modern renk paleti
const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // Emerald
  secondary: [20, 184, 166] as [number, number, number], // Teal
  accent: [13, 148, 136] as [number, number, number], // Dark Teal
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [251, 146, 60] as [number, number, number], // Orange
  danger: [239, 68, 68] as [number, number, number], // Red
  info: [59, 130, 246] as [number, number, number], // Blue
  dark: [30, 41, 59] as [number, number, number], // Slate-800
  gray: [100, 116, 139] as [number, number, number], // Slate-500
  lightGray: [241, 245, 249] as [number, number, number], // Slate-100
  white: [255, 255, 255] as [number, number, number],
}

// Türkçe karakterleri düzelt
const removeTurkishChars = (text: string): string => {
  if (!text) return ""
  return text
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
}

const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  return removeTurkishChars(String(text))
}

const formatCurrency = (amount: number): string => {
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " TL"
  )
}

const formatDate = (date: Date): string => {
  const formatted = format(date, "dd MMMM yyyy", { locale: tr })
  return removeTurkishChars(formatted)
}

class ModernPDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private data: any
  private pageNumber = 1

  constructor(doc: jsPDF, data: any) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 15
    this.currentY = this.margin
    this.data = data
  }

  private addGradientRect(
    x: number,
    y: number,
    width: number,
    height: number,
    startColor: [number, number, number],
    endColor: [number, number, number],
  ) {
    this.doc.setFillColor(...startColor)
    this.doc.rect(x, y, width, height, "F")
  }

  private async addModernHeader() {
    // Header background
    this.addGradientRect(0, 0, this.pageWidth, 50, COLORS.primary, COLORS.accent)

    // Logo area
    this.doc.setFillColor(...COLORS.white)
    this.doc.rect(15, 10, 30, 30, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", 30, 28, { align: "center" })

    // Main title
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(18)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI PORTFOY RAPORU", 55, 25)

    // Subtitle
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Detayli Finansal Analiz", 55, 37)

    // Date - right aligned
    const rightX = this.pageWidth - this.margin
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.white)
    this.doc.text(formatDate(new Date()), rightX - 70, 20)

    // User name if exists
    if (this.data.userData?.name) {
      this.doc.setFont("helvetica", "bold")
      this.doc.setFontSize(10)
      this.doc.text(safeText(this.data.userData.name), rightX - 70, 32)
    }

    this.currentY = 65
  }

  private addModernMetricCards(
    metrics: Array<{
      title: string
      value: string
      subtitle?: string
      color?: keyof typeof COLORS
    }>,
  ) {
    this.checkPageBreak(45)

    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 40
    const spacing = 10

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + spacing)
      const color = COLORS[metric.color || "primary"]

      // Card background
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(0.5)
      this.doc.rect(x, this.currentY, cardWidth, cardHeight, "FD")

      // Top colored bar
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 3, "F")

      // Title
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 4, this.currentY + 11)

      // Value
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(safeText(metric.value), x + 4, this.currentY + 23)

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(6)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(safeText(metric.subtitle), x + 4, this.currentY + 33)
      }
    })

    this.currentY += cardHeight + 15
  }

  private addModernSection(title: string, color: keyof typeof COLORS = "primary", forceNewPage = false) {
    if (forceNewPage) {
      this.addPage()
    } else {
      this.checkPageBreak(25)
    }

    // Section background with gradient effect
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      22,
      COLORS.lightGray,
      COLORS.white,
    )

    // Colored accent bar
    this.doc.setFillColor(...COLORS[color])
    this.doc.rect(this.margin, this.currentY, 4, 22, "F")

    // Section title with modern styling
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title.toUpperCase()), this.margin + 10, this.currentY + 14)

    this.currentY += 27
  }

  private addModernTable(
    headers: string[],
    rows: string[][],
    options?: {
      headerColor?: keyof typeof COLORS
      alternateRows?: boolean
      columnWidths?: number[]
    },
  ) {
    const opts = {
      headerColor: "primary" as keyof typeof COLORS,
      alternateRows: true,
      ...options,
    }

    const totalWidth = this.pageWidth - 2 * this.margin
    const colWidths = opts.columnWidths || headers.map(() => totalWidth / headers.length)
    const rowHeight = 20
    const headerHeight = 25

    this.checkPageBreak(headerHeight + Math.min(rows.length, 5) * rowHeight + 20)

    // Header background
    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.rect(this.margin, this.currentY, totalWidth, headerHeight, "F")

    // Header text
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      const text = safeText(header).toUpperCase()
      this.doc.text(text, xPos + 5, this.currentY + 16)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    // Table rows
    rows.forEach((row, rowIndex) => {
      // Check page break
      if (rowIndex > 0 && rowIndex % 10 === 0) {
        this.checkPageBreak(rowHeight * 3)
      }

      // Alternate row background
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 248, 248)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      // Bottom border
      this.doc.setDrawColor(220, 220, 220)
      this.doc.setLineWidth(0.2)
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

      // Row content
      xPos = this.margin
      row.forEach((cell, colIndex) => {
        // Set text color based on content
        if (cell.includes("TL")) {
          this.doc.setTextColor(...COLORS.primary)
          this.doc.setFont("helvetica", "bold")
        } else if (cell.includes("%")) {
          this.doc.setTextColor(...COLORS.info)
          this.doc.setFont("helvetica", "normal")
        } else {
          this.doc.setTextColor(...COLORS.dark)
          this.doc.setFont("helvetica", "normal")
        }

        this.doc.setFontSize(8)
        const maxWidth = colWidths[colIndex] - 8
        const lines = this.doc.splitTextToSize(safeText(cell), maxWidth)
        this.doc.text(lines[0] || "", xPos + 5, this.currentY + 13)
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 10
  }

  private async addCreditCard(credit: any, index: number) {
    this.checkPageBreak(110)

    const cardWidth = this.pageWidth - 2 * this.margin
    const cardHeight = 105

    // Card container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, cardWidth, cardHeight, "FD")

    // Header gradient
    const headerHeight = 24
    this.addGradientRect(this.margin, this.currentY, cardWidth, headerHeight, COLORS.primary, COLORS.secondary)

    // Bank logo circle
    const logoX = this.margin + 12
    const logoY = this.currentY + headerHeight / 2
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(logoX, logoY, 7, "F")

    // Bank initials
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    const bankName = safeText(credit.bankName || "Bilinmeyen Banka")
    const initials = bankName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    this.doc.text(initials, logoX, logoY + 2, { align: "center" })

    // Bank name and credit type
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    const creditTypeText = safeText(credit.creditType || "Kredi")
    this.doc.text(`${bankName} - ${creditTypeText}`, this.margin + 28, this.currentY + 15)

    // Status badge
    if (credit.status === "active") {
      const statusX = cardWidth - 38
      const statusY = this.currentY + 6
      this.doc.setFillColor(236, 253, 245)
      this.doc.roundedRect(statusX, statusY, 38, 13, 2, 2, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(8)
      this.doc.text("AKTIF", statusX + 19, statusY + 9, { align: "center" })
    }

    // Progress bar section
    const progressY = this.currentY + headerHeight + 10
    const progressBarWidth = cardWidth - 24
    const progressBarHeight = 5
    const progressBarX = this.margin + 12

    // Calculate progress correctly - using payment_progress if available
    let progressPercentage = 0
    if (credit.payment_progress !== undefined && credit.payment_progress !== null) {
      // Use payment_progress directly if available
      progressPercentage = credit.payment_progress
    } else if (credit.total_installments && credit.remaining_installments !== undefined) {
      // Calculate from installments
      const paidInstallments = credit.total_installments - credit.remaining_installments
      progressPercentage = (paidInstallments / credit.total_installments) * 100
    } else if (credit.amount && credit.remainingDebt !== undefined) {
      // Fallback to amount calculation
      const paidAmount = credit.amount - credit.remainingDebt
      progressPercentage = credit.amount > 0 ? (paidAmount / credit.amount) * 100 : 0
    }

    // Ensure percentage is between 0 and 100
    progressPercentage = Math.max(0, Math.min(100, progressPercentage))

    // Progress percentage text
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`%${progressPercentage.toFixed(1)} ODENDI`, progressBarX, progressY - 2)

    // Progress bar background
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.rect(progressBarX, progressY, progressBarWidth, progressBarHeight, "F")

    // Progress bar fill
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(progressBarX, progressY, (progressBarWidth * progressPercentage) / 100, progressBarHeight, "F")

    // Content in 2x2 grid for better spacing
    const contentY = progressY + 18
    const col1X = this.margin + 12
    const col2X = this.margin + cardWidth * 0.52

    // Row 1 - Kredi Tutari ve Aylik Odeme
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KREDI TUTARI", col1X, contentY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.amount || 0), col1X, contentY + 12)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK ODEME", col2X, contentY)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.monthlyPayment || 0), col2X, contentY + 12)

    // Row 2 - Kalan Borc ve Faiz Orani
    const row2Y = contentY + 25
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KALAN BORC", col1X, row2Y)
    this.doc.setTextColor(...COLORS.danger)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.remainingDebt || 0), col1X, row2Y + 12)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("FAIZ ORANI", col2X, row2Y)
    this.doc.setTextColor(...COLORS.info)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, col2X, row2Y + 12)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK", col2X, row2Y + 22)

    this.currentY += cardHeight + 10
  }

  private addSummarySection() {
    // Start on a new page for summary
    this.addPage()

    // Page title with gradient background
    this.addGradientRect(0, 0, this.pageWidth, 40, COLORS.primary, COLORS.secondary)
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RAPOR ÖZETİ VE ANALİZ", this.pageWidth / 2, 26, { align: "center" })

    this.currentY = 55

    // Summary Cards - 2x2 grid with tighter spacing
    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 2
    const cardHeight = 50
    const cardSpacing = 10

    const totalInterest =
      this.data.credits?.reduce((sum: number, credit: any) => {
        const monthly = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 100 / 12
        return sum + monthly * 12
      }, 0) || 0

    const avgRate =
      this.data.credits?.length > 0
        ? this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length
        : 0

    const summaryCards = [
      {
        title: "TOPLAM KREDI",
        value: `${this.data.totalCredits || 0}`,
        subtitle: "adet",
        color: COLORS.primary,
      },
      {
        title: "ORTALAMA FAIZ",
        value: `%${avgRate.toFixed(2)}`,
        subtitle: "yillik",
        color: COLORS.info,
      },
      {
        title: "AYLIK ODEME",
        value: formatCurrency(this.data.monthlyPayment || 0),
        subtitle: "toplam",
        color: COLORS.warning,
      },
      {
        title: "YILLIK FAIZ",
        value: formatCurrency(totalInterest),
        subtitle: "toplam",
        color: COLORS.danger,
      },
    ]

    // Draw summary cards with improved design
    summaryCards.forEach((card, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      const x = this.margin + col * (cardWidth + cardSpacing)
      const y = this.currentY + row * (cardHeight + cardSpacing)

      // Card shadow effect
      this.doc.setFillColor(240, 240, 240)
      this.doc.rect(x + 1, y + 1, cardWidth, cardHeight, "F")

      // Card background
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(220, 220, 220)
      this.doc.setLineWidth(0.5)
      this.doc.rect(x, y, cardWidth, cardHeight, "FD")

      // Colored accent bar
      this.doc.setFillColor(...card.color)
      this.doc.rect(x, y, 3, cardHeight, "F")

      // Icon circle background
      this.doc.setFillColor(...card.color)
      this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
      this.doc.circle(x + cardWidth - 25, y + 25, 15, "F")
      this.doc.setGState(this.doc.GState({ opacity: 1 }))

      // Title
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(card.title, x + 10, y + 15)

      // Value
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(card.value, x + 10, y + 30)

      // Subtitle
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(card.subtitle, x + 10, y + 40)
    })

    this.currentY += 2 * (cardHeight + cardSpacing)

    // Add professional charts
    if (this.data.chartData || this.data.credits) {
      this.addProfessionalCharts()
    }

    // Key insights at the bottom
    this.addCompactInsights()
  }

  private addProfessionalCharts() {
    this.currentY += 15

    // Charts section header with gradient background
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      25,
      COLORS.secondary,
      COLORS.accent,
    )
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(this.margin, this.currentY, 4, 25, "F")
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("GRAFİK ANALİZLER", this.margin + 10, this.currentY + 16)

    this.currentY += 32

    const chartWidth = (this.pageWidth - 2 * this.margin - 10) / 2
    const chartHeight = 85

    // Left Chart - Pie Chart for Bank Distribution
    if (this.data.credits && this.data.credits.length > 0) {
      this.drawProfessionalPieChart(
        this.margin,
        this.currentY,
        chartWidth,
        chartHeight,
        "Banka Dagilimi",
        this.calculateBankDistribution(),
      )
    }

    // Right Chart - Bar Chart for Interest Rates
    if (this.data.credits && this.data.credits.length > 0) {
      this.drawProfessionalBarChart(
        this.margin + chartWidth + 10,
        this.currentY,
        chartWidth,
        chartHeight,
        "Faiz Oranlari",
        this.data.credits,
      )
    }

    this.currentY += chartHeight + 10

    // Bottom Chart - Progress Overview
    if (this.data.credits && this.data.credits.length > 0) {
      this.drawProfessionalProgressChart(
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        70,
        "Odeme Ilerleme Durumu",
        this.data.credits,
      )
      this.currentY += 75
    }
  }

  private drawProfessionalPieChart(x: number, y: number, width: number, height: number, title: string, data: any[]) {
    // Chart container with border
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(210, 210, 210)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height, "FD")

    // Title with background
    this.doc.setFillColor(250, 250, 250)
    this.doc.rect(x, y, width, 20, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + width / 2, y + 13, { align: "center" })

    // Draw actual pie chart
    const centerX = x + width / 3
    const centerY = y + 50
    const radius = 22

    const colors = [COLORS.primary, COLORS.info, COLORS.warning, COLORS.success, COLORS.danger]
    const total = data.reduce((sum, item) => sum + item.amount, 0)
    let currentAngle = -Math.PI / 2 // Start from top

    // Draw pie slices
    data.slice(0, 5).forEach((item, index) => {
      const sliceAngle = (item.amount / total) * 2 * Math.PI
      const endAngle = currentAngle + sliceAngle

      // Draw slice
      this.doc.setFillColor(...colors[index % colors.length])
      this.doc.setDrawColor(...colors[index % colors.length])

      // Create pie slice path
      const steps = 20
      for (let i = 0; i <= steps; i++) {
        const angle = currentAngle + (sliceAngle * i) / steps
        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius

        if (i === 0) {
          this.doc.line(centerX, centerY, x1, y1)
        }
      }

      currentAngle = endAngle
    })

    // Legend on the right
    const legendX = x + width * 0.55
    const legendY = y + 30

    data.slice(0, 5).forEach((item, index) => {
      // Color box
      this.doc.setFillColor(...colors[index % colors.length])
      this.doc.rect(legendX, legendY + index * 10, 5, 5, "F")

      // Label
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      const percentage = ((item.amount / total) * 100).toFixed(1)
      const label = safeText(item.name).substring(0, 12)
      this.doc.text(`${label}`, legendX + 7, legendY + index * 10 + 4)

      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${percentage}`, legendX + 55, legendY + index * 10 + 4)
    })
  }

  private drawProfessionalBarChart(x: number, y: number, width: number, height: number, title: string, credits: any[]) {
    // Chart container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(210, 210, 210)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height, "FD")

    // Title with background
    this.doc.setFillColor(250, 250, 250)
    this.doc.rect(x, y, width, 20, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + width / 2, y + 13, { align: "center" })

    // Sort credits by interest rate
    const sortedCredits = [...credits].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0)).slice(0, 5)
    const maxRate = Math.max(...sortedCredits.map((c) => c.interestRate || 0))

    const barY = y + 28
    const barHeight = 10
    const maxBarWidth = width - 70

    const avgRate =
      this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length

    sortedCredits.forEach((credit, index) => {
      const rate = credit.interestRate || 0
      const barWidth = (rate / maxRate) * maxBarWidth

      // Bank name
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      const bankName = safeText(credit.bankName || "Diger").substring(0, 10)
      this.doc.text(bankName, x + 5, barY + index * 12 + 7)

      // Bar with gradient effect
      const barColor = rate > avgRate ? COLORS.danger : COLORS.success
      this.doc.setFillColor(...barColor)
      this.doc.rect(x + 45, barY + index * 12 + 2, barWidth, barHeight, "F")

      // Lighter shade for effect
      this.doc.setFillColor(...barColor)
      this.doc.setGState(this.doc.GState({ opacity: 0.3 }))
      this.doc.rect(x + 45, barY + index * 12 + 2, barWidth, barHeight / 2, "F")
      this.doc.setGState(this.doc.GState({ opacity: 1 }))

      // Rate value
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${rate.toFixed(2)}`, x + 47 + barWidth, barY + index * 12 + 8)
    })

    // Average line
    const avgLineX = x + 45 + (avgRate / maxRate) * maxBarWidth

    this.doc.setDrawColor(...COLORS.warning)
    this.doc.setLineWidth(0.5)
    this.doc.setLineDash([2, 2], 0)
    this.doc.line(avgLineX, barY, avgLineX, barY + 55)
    this.doc.setLineDash([], 0)

    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(6)
    this.doc.text("ORT", avgLineX - 5, barY - 2)
  }

  private drawProfessionalProgressChart(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    credits: any[],
  ) {
    // Chart container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(210, 210, 210)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height, "FD")

    // Title with background
    this.doc.setFillColor(250, 250, 250)
    this.doc.rect(x, y, width, 18, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + width / 2, y + 12, { align: "center" })

    // Progress bars
    const barY = y + 25
    const maxItems = Math.min(credits.length, 4)
    const barHeight = 8
    const barWidth = width - 120

    for (let i = 0; i < maxItems; i++) {
      const credit = credits[i]
      let progressPercentage = 0

      if (credit.payment_progress !== undefined) {
        progressPercentage = credit.payment_progress
      } else if (credit.amount && credit.remainingDebt !== undefined) {
        const paidAmount = credit.amount - credit.remainingDebt
        progressPercentage = credit.amount > 0 ? (paidAmount / credit.amount) * 100 : 0
      }

      progressPercentage = Math.max(0, Math.min(100, progressPercentage))

      // Bank name and credit type
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      const label = `${safeText(credit.bankName || "").substring(0, 12)} - ${safeText(credit.creditType || "").substring(0, 8)}`
      this.doc.text(label, x + 5, barY + i * 11 + 6)

      // Progress bar background
      this.doc.setFillColor(240, 240, 240)
      this.doc.rect(x + 80, barY + i * 11 + 1, barWidth, barHeight, "F")

      // Progress bar fill with gradient
      const fillColor =
        progressPercentage > 75 ? COLORS.success : progressPercentage > 50 ? COLORS.warning : COLORS.danger
      this.doc.setFillColor(...fillColor)
      this.doc.rect(x + 80, barY + i * 11 + 1, (barWidth * progressPercentage) / 100, barHeight, "F")

      // Percentage text
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${progressPercentage.toFixed(0)}`, x + 82 + barWidth, barY + i * 11 + 6)
    }
  }

  private addCompactInsights() {
    this.currentY += 5

    // Insights header with gradient background
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      22,
      COLORS.lightGray,
      COLORS.white,
    )
    this.doc.setFillColor(...COLORS.success)
    this.doc.rect(this.margin, this.currentY, 4, 22, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("ÖNEMLİ BİLGİLER", this.margin + 10, this.currentY + 14)

    this.currentY += 27

    // Two column insights
    const colWidth = (this.pageWidth - 2 * this.margin) / 2

    const leftInsights = [
      `En yuksek faiz: ${this.data.credits?.length > 0 ? "%" + Math.max(...this.data.credits.map((c: any) => c.interestRate || 0)).toFixed(2) : "N/A"}`,
      `En dusuk faiz: ${this.data.credits?.length > 0 ? "%" + Math.min(...this.data.credits.map((c: any) => c.interestRate || 0)).toFixed(2) : "N/A"}`,
    ]

    const rightInsights = [
      `Aktif kredi: ${this.data.activeCredits || 0} adet`,
      `Rapor tarihi: ${formatDate(new Date())}`,
    ]

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")

    leftInsights.forEach((insight, index) => {
      this.doc.text(`• ${insight}`, this.margin + 5, this.currentY + index * 10)
    })

    rightInsights.forEach((insight, index) => {
      this.doc.text(`• ${insight}`, this.margin + colWidth, this.currentY + index * 10)
    })
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      // Footer background
      this.addGradientRect(0, this.pageHeight - 20, this.pageWidth, 20, COLORS.primary, COLORS.accent)

      // Footer content
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(7)

      // Left - Website
      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 8)

      // Center - Tagline
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Finansal ozgurluge giden yol", this.pageWidth / 2, this.pageHeight - 8, { align: "center" })

      // Right - Page number
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 8, { align: "right" })
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 35) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = 20
  }

  private calculateBankDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const bankMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const bankName = safeText(credit.bankName || "Bilinmeyen")
      const amount = credit.remainingDebt || 0
      totalAmount += amount

      if (bankMap.has(bankName)) {
        const existing = bankMap.get(bankName)
        existing.count += 1
        existing.amount += amount
      } else {
        bankMap.set(bankName, { name: bankName, count: 1, amount })
      }
    })

    return Array.from(bankMap.values())
      .map((bank) => ({
        ...bank,
        percentage: totalAmount > 0 ? (bank.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  private calculateCreditTypeDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const typeMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const creditType = safeText(credit.creditType || "Diger")
      const amount = credit.remainingDebt || 0
      totalAmount += amount

      if (typeMap.has(creditType)) {
        const existing = typeMap.get(creditType)
        existing.count += 1
        existing.amount += amount
      } else {
        typeMap.set(creditType, { type: creditType, count: 1, amount })
      }
    })

    return Array.from(typeMap.values())
      .map((type) => ({
        ...type,
        percentage: totalAmount > 0 ? (type.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  public async generate() {
    try {
      await this.addModernHeader()

      const metrics = [
        {
          title: "Toplam Kredi",
          value: this.data.totalCredits?.toString() || "0",
          subtitle: `${this.data.activeCredits || 0} aktif`,
          color: "primary" as keyof typeof COLORS,
        },
        {
          title: "Toplam Borc",
          value: formatCurrency(this.data.totalDebt || 0),
          subtitle: "Kalan",
          color: "danger" as keyof typeof COLORS,
        },
        {
          title: "Aylik Odeme",
          value: formatCurrency(this.data.monthlyPayment || 0),
          subtitle: "Taksit",
          color: "warning" as keyof typeof COLORS,
        },
        {
          title: "Toplam Kredi",
          value: formatCurrency(this.data.totalPayment || 0),
          subtitle: "Baslangic",
          color: "success" as keyof typeof COLORS,
        },
      ]

      this.addModernMetricCards(metrics)

      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("KREDİ DETAYLARI", "primary")

        for (const [index, credit] of this.data.credits.entries()) {
          await this.addCreditCard(credit, index)
        }
      }

      // Banka Dagilimi
      this.addModernSection("BANKA DAĞILIMI", "info", true) // Force new page
      const bankDist = this.calculateBankDistribution()
      if (bankDist.length > 0) {
        const headers = ["Banka", "Adet", "Toplam Borc", "Oran"]
        const rows = bankDist.map((b) => [
          b.name,
          b.count.toString(),
          formatCurrency(b.amount),
          `%${b.percentage.toFixed(1)}`,
        ])
        this.addModernTable(headers, rows, {
          headerColor: "info",
          columnWidths: [140, 50, 120, 70],
        })
      }

      // Kredi Turu Dagilimi
      this.addModernSection("KREDİ TÜRÜ DAĞILIMI", "secondary", true) // Force new page
      const typeDist = this.calculateCreditTypeDistribution()
      if (typeDist.length > 0) {
        const headers = ["Kredi Türü", "Adet", "Toplam Tutar", "Oran"]
        const rows = typeDist.map((t) => [
          t.type,
          t.count.toString(),
          formatCurrency(t.amount),
          `%${t.percentage.toFixed(1)}`,
        ])
        this.addModernTable(headers, rows, {
          headerColor: "secondary",
          columnWidths: [140, 50, 120, 70],
        })
      }

      // Faiz Analizi
      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("FAİZ ANALİZİ", "warning", true) // Force new page
        const headers = ["Banka", "Kredi Türü", "Faiz Orani", "Aylik Faiz", "Yillik Faiz"]
        const rows = this.data.credits.map((credit: any) => {
          const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 100 / 12
          const yearlyInterest = monthlyInterest * 12
          return [
            safeText(credit.bankName || "Bilinmeyen"),
            safeText(credit.creditType || "Diger"),
            `%${(credit.interestRate || 0).toFixed(2)}`,
            formatCurrency(monthlyInterest),
            formatCurrency(yearlyInterest),
          ]
        })
        this.addModernTable(headers, rows, {
          headerColor: "warning",
          columnWidths: [100, 80, 60, 75, 75],
        })
      }

      // Rapor Özeti
      this.addModernSection("RAPOR ÖZETİ", "success", true) // Force new page
      this.addSummarySection()

      this.addModernFooter()
    } catch (error) {
      console.error("PDF olusturma hatasi:", error)
      throw error
    }
  }
}

export async function generatePDFReport(data: any): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    const generator = new ModernPDFGenerator(doc, data)
    await generator.generate()

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: tr })
    const filename = `kredi-raporu-${timestamp}.pdf`

    doc.save(filename)

    console.log("PDF basariyla olusturuldu:", filename)
  } catch (error) {
    console.error("PDF olusturma hatasi:", error)
    throw error
  }
}

export async function generateCreditReport(data: {
  credit: any
  paymentPlans?: any[]
  paymentHistory?: any[]
  dynamicStats?: any
}): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    // Create a simplified report data structure for individual credit
    const reportData = {
      reportTitle: "Tekil Kredi Raporu",
      userData: {
        name: "Kullanici",
        email: "email@example.com",
      },
      totalCredits: 1,
      activeCredits: data.credit?.status === "active" ? 1 : 0,
      totalDebt: data.dynamicStats?.remainingDebt || data.credit?.remaining_debt || 0,
      totalPayment: data.credit?.amount || data.credit?.initial_amount || 0,
      monthlyPayment: data.credit?.monthly_payment || 0,
      credits: [
        {
          id: data.credit?.id,
          bankName: data.credit?.banks?.name || data.credit?.bankName || "Bilinmeyen Banka",
          creditType: data.credit?.credit_types?.name || data.credit?.creditType || "Diger",
          remainingDebt: data.dynamicStats?.remainingDebt || data.credit?.remaining_debt || 0,
          monthlyPayment: data.credit?.monthly_payment || 0,
          interestRate: data.credit?.interest_rate || 0,
          status: data.credit?.status || "unknown",
          amount: data.credit?.amount || data.credit?.initial_amount || 0,
        },
      ],
    }

    const generator = new ModernPDFGenerator(doc, reportData)
    await generator.generate()

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: tr })
    const filename = `kredi-detay-raporu-${data.credit?.credit_code || timestamp}.pdf`

    doc.save(filename)

    console.log("PDF basariyla olusturuldu:", filename)
  } catch (error) {
    console.error("PDF olusturma hatasi:", error)
    throw error
  }
}
