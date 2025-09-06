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

// Logo'yu base64'e çeviren yardımcı fonksiyon
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Logo yuklenemedi:", error)
    return null
  }
}

class ModernPDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private data: any
  private pageNumber = 1
  private logoBase64: string | null = null

  constructor(doc: jsPDF, data: any) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 20 // Margin'i artırdım
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
    // Gradient efekti için birden fazla dikdörtgen çiz
    const steps = 10
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio)
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio)
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio)
      
      this.doc.setFillColor(r, g, b)
      this.doc.rect(x, y + (height / steps) * i, width, height / steps, "F")
    }
  }

  private async addModernHeader() {
    // Header background - daha yüksek
    this.addGradientRect(0, 0, this.pageWidth, 55, COLORS.primary, COLORS.accent)

    // Logo ekleme
    if (this.logoBase64) {
      try {
        this.doc.addImage(this.logoBase64, "PNG", 20, 12, 35, 35)
      } catch (error) {
        console.error("Logo eklenemedi:", error)
        // Logo yüklenemezse fallback
        this.doc.setFillColor(...COLORS.white)
        this.doc.rect(20, 12, 35, 35, "F")
        this.doc.setTextColor(...COLORS.primary)
        this.doc.setFontSize(18)
        this.doc.setFont("helvetica", "bold")
        this.doc.text("KT", 37.5, 32, { align: "center" })
      }
    } else {
      // Logo yoksa fallback
      this.doc.setFillColor(...COLORS.white)
      this.doc.rect(20, 12, 35, 35, "F")
      this.doc.setTextColor(...COLORS.primary)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("KT", 37.5, 32, { align: "center" })
    }

    // Main title
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(20)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI PORTFOY RAPORU", 65, 26)

    // Subtitle
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Detayli Finansal Analiz", 65, 40)

    // Date - right aligned
    const rightX = this.pageWidth - this.margin
    this.doc.setFontSize(10)
    this.doc.setTextColor(...COLORS.white)
    this.doc.text(formatDate(new Date()), rightX - 80, 22)

    // User name if exists
    if (this.data.userData?.name) {
      this.doc.setFont("helvetica", "bold")
      this.doc.setFontSize(11)
      this.doc.text(safeText(this.data.userData.name), rightX - 80, 36)
    }

    this.currentY = 70
  }

  private addModernMetricCards(
    metrics: Array<{
      title: string
      value: string
      subtitle?: string
      color?: keyof typeof COLORS
    }>,
  ) {
    this.checkPageBreak(50)

    const cardWidth = (this.pageWidth - 2 * this.margin - 45) / 4
    const cardHeight = 45
    const spacing = 15

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + spacing)
      const color = COLORS[metric.color || "primary"]

      // Card shadow
      this.doc.setFillColor(230, 230, 230)
      this.doc.rect(x + 2, this.currentY + 2, cardWidth, cardHeight, "F")

      // Card background
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(0.5)
      this.doc.rect(x, this.currentY, cardWidth, cardHeight, "FD")

      // Top colored bar
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 4, "F")

      // Title
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 5, this.currentY + 14)

      // Value
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(safeText(metric.value), x + 5, this.currentY + 28)

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(7)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(safeText(metric.subtitle), x + 5, this.currentY + 38)
      }
    })

    this.currentY += cardHeight + 20
  }

  private addModernSection(title: string, color: keyof typeof COLORS = "primary", forceNewPage = false) {
    if (forceNewPage) {
      this.addPage()
    } else {
      this.checkPageBreak(30)
    }

    // Section background with gradient effect
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      25,
      COLORS.lightGray,
      COLORS.white,
    )

    // Colored accent bar
    this.doc.setFillColor(...COLORS[color])
    this.doc.rect(this.margin, this.currentY, 5, 25, "F")

    // Section title with modern styling
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title.toUpperCase()), this.margin + 12, this.currentY + 16)

    this.currentY += 35
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
    const rowHeight = 22
    const headerHeight = 28

    this.checkPageBreak(headerHeight + Math.min(rows.length, 5) * rowHeight + 25)

    // Table shadow
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin + 2, this.currentY + 2, totalWidth, headerHeight + rows.length * rowHeight, "F")

    // Header background
    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.rect(this.margin, this.currentY, totalWidth, headerHeight, "F")

    // Header text
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      const text = safeText(header).toUpperCase()
      this.doc.text(text, xPos + 6, this.currentY + 18)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    // Table rows
    rows.forEach((row, rowIndex) => {
      // Check page break
      if (rowIndex > 0 && rowIndex % 8 === 0) {
        this.checkPageBreak(rowHeight * 3)
      }

      // Alternate row background
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      } else {
        this.doc.setFillColor(...COLORS.white)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      // Bottom border
      this.doc.setDrawColor(220, 220, 220)
      this.doc.setLineWidth(0.3)
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

        this.doc.setFontSize(9)
        const maxWidth = colWidths[colIndex] - 10
        const lines = this.doc.splitTextToSize(safeText(cell), maxWidth)
        this.doc.text(lines[0] || "", xPos + 6, this.currentY + 14)
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 15
  }

  private async addCreditCard(credit: any, index: number) {
    this.checkPageBreak(120)

    const cardWidth = this.pageWidth - 2 * this.margin
    const cardHeight = 115

    // Card shadow
    this.doc.setFillColor(235, 235, 235)
    this.doc.rect(this.margin + 3, this.currentY + 3, cardWidth, cardHeight, "F")

    // Card container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.6)
    this.doc.rect(this.margin, this.currentY, cardWidth, cardHeight, "FD")

    // Header gradient
    const headerHeight = 28
    this.addGradientRect(this.margin, this.currentY, cardWidth, headerHeight, COLORS.primary, COLORS.secondary)

    // Bank logo circle
    const logoX = this.margin + 15
    const logoY = this.currentY + headerHeight / 2
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(logoX, logoY, 8, "F")

    // Bank initials
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")
    const bankName = safeText(credit.bankName || "Bilinmeyen Banka")
    const initials = bankName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    this.doc.text(initials, logoX, logoY + 3, { align: "center" })

    // Bank name and credit type
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    const creditTypeText = safeText(credit.creditType || "Kredi")
    this.doc.text(`${bankName} - ${creditTypeText}`, this.margin + 35, this.currentY + 17)

    // Status badge
    if (credit.status === "active") {
      const statusX = cardWidth - 45
      const statusY = this.currentY + 7
      this.doc.setFillColor(236, 253, 245)
      this.doc.roundedRect(statusX, statusY, 42, 15, 2, 2, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(9)
      this.doc.text("AKTIF", statusX + 21, statusY + 10, { align: "center" })
    }

    // Progress bar section
    const progressY = this.currentY + headerHeight + 12
    const progressBarWidth = cardWidth - 30
    const progressBarHeight = 6
    const progressBarX = this.margin + 15

    // Calculate progress correctly
    let progressPercentage = 0
    if (credit.payment_progress !== undefined && credit.payment_progress !== null) {
      progressPercentage = credit.payment_progress
    } else if (credit.total_installments && credit.remaining_installments !== undefined) {
      const paidInstallments = credit.total_installments - credit.remaining_installments
      progressPercentage = (paidInstallments / credit.total_installments) * 100
    } else if (credit.amount && credit.remainingDebt !== undefined) {
      const paidAmount = credit.amount - credit.remainingDebt
      progressPercentage = credit.amount > 0 ? (paidAmount / credit.amount) * 100 : 0
    }

    progressPercentage = Math.max(0, Math.min(100, progressPercentage))

    // Progress percentage text
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`%${progressPercentage.toFixed(1)} ODENDI`, progressBarX, progressY - 2)

    // Progress bar background
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(progressBarX, progressY, progressBarWidth, progressBarHeight, 2, 2, "F")

    // Progress bar fill
    this.doc.setFillColor(...COLORS.primary)
    this.doc.roundedRect(progressBarX, progressY, (progressBarWidth * progressPercentage) / 100, progressBarHeight, 2, 2, "F")

    // Content in 2x2 grid with better spacing
    const contentY = progressY + 20
    const col1X = this.margin + 15
    const col2X = this.margin + cardWidth * 0.52

    // Row 1 - Kredi Tutari ve Aylik Odeme
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KREDI TUTARI", col1X, contentY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.amount || 0), col1X, contentY + 14)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK ODEME", col2X, contentY)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.monthlyPayment || 0), col2X, contentY + 14)

    // Row 2 - Kalan Borc ve Faiz Orani
    const row2Y = contentY + 28
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KALAN BORC", col1X, row2Y)
    this.doc.setTextColor(...COLORS.danger)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.remainingDebt || 0), col1X, row2Y + 14)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("FAIZ ORANI", col2X, row2Y)
    this.doc.setTextColor(...COLORS.info)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, col2X, row2Y + 14)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK", col2X + 45, row2Y + 14)

    this.currentY += cardHeight + 15
  }

  private addSummarySection() {
    // Start on a new page for summary
    this.addPage()

    // Page title with gradient background
    this.addGradientRect(0, 0, this.pageWidth, 45, COLORS.primary, COLORS.secondary)
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RAPOR OZETI VE ANALIZ", this.pageWidth / 2, 28, { align: "center" })

    this.currentY = 65

    // Summary Cards - 2x2 grid with better spacing
    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 2
    const cardHeight = 55
    const cardSpacing = 15

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
        icon: "📊",
      },
      {
        title: "ORTALAMA FAIZ",
        value: `%${avgRate.toFixed(2)}`,
        subtitle: "yillik",
        color: COLORS.info,
        icon: "📈",
      },
      {
        title: "AYLIK ODEME",
        value: formatCurrency(this.data.monthlyPayment || 0),
        subtitle: "toplam",
        color: COLORS.warning,
        icon: "💳",
      },
      {
        title: "YILLIK FAIZ",
        value: formatCurrency(totalInterest),
        subtitle: "toplam",
        color: COLORS.danger,
        icon: "💰",
      },
    ]

    // Draw summary cards with improved design
    summaryCards.forEach((card, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      const x = this.margin + col * (cardWidth + cardSpacing)
      const y = this.currentY + row * (cardHeight + cardSpacing)

      // Card shadow
      this.doc.setFillColor(240, 240, 240)
      this.doc.rect(x + 2, y + 2, cardWidth, cardHeight, "F")

      // Card background
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(220, 220, 220)
      this.doc.setLineWidth(0.5)
      this.doc.rect(x, y, cardWidth, cardHeight, "FD")

      // Colored accent bar
      this.doc.setFillColor(...card.color)
      this.doc.rect(x, y, 4, cardHeight, "F")

      // Icon circle background
      this.doc.setFillColor(...card.color)
      this.doc.setGState(this.doc.GState({ opacity: 0.15 }))
      this.doc.circle(x + cardWidth - 28, y + 28, 18, "F")
      this.doc.setGState(this.doc.GState({ opacity: 1 }))

      // Title
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(card.title, x + 12, y + 18)

      // Value
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(card.value, x + 12, y + 35)

      // Subtitle
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(card.subtitle, x + 12, y + 46)
    })

    this.currentY += 2 * (cardHeight + cardSpacing) + 20

    // Add professional charts with better spacing
    if (this.data.chartData || this.data.credits) {
      this.addProfessionalCharts()
    }
  }

  private addProfessionalCharts() {
    // Charts section header
    this.addModernSection("GRAFIK ANALIZLER", "secondary")

    // First row - Two charts side by side
    const chartWidth = (this.pageWidth - 2 * this.margin - 20) / 2
    const chartHeight = 100

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
        this.margin + chartWidth + 20,
        this.currentY,
        chartWidth,
        chartHeight,
        "Faiz Oranlari",
        this.data.credits,
      )
    }

    this.currentY += chartHeight + 25

    // Check for page break before progress chart
    this.checkPageBreak(90)

    // Bottom Chart - Progress Overview (full width)
    if (this.data.credits && this.data.credits.length > 0) {
      this.drawProfessionalProgressChart(
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        80,
        "Odeme Ilerleme Durumu",
        this.data.credits,
      )
      this.currentY += 90
    }

    // Key insights section
    this.addCompactInsights()
  }

  private drawProfessionalPieChart(x: number, y: number, width: number, height: number, title: string, data: any[]) {
    // Chart container with shadow
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(210, 210, 210)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height, "FD")

    // Title with gradient background
    this.addGradientRect(x, y, width, 22, COLORS.lightGray, COLORS.white)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + width / 2, y + 14, { align: "center" })

    // Draw actual pie chart
    const centerX = x + width / 3
    const centerY = y + 58
    const radius = 25

    const colors = [COLORS.primary, COLORS.info, COLORS.warning, COLORS.success, COLORS.danger]
    const total = data.reduce((sum, item) => sum + item.amount, 0)
    let currentAngle = -Math.PI / 2

    // Draw pie slices with better visuals
    data.slice(0, 5).forEach((item, index) => {
      const sliceAngle = (item.amount / total) * 2 * Math.PI
      const endAngle = currentAngle + sliceAngle

      // Draw slice
      this.doc.setFillColor(...colors[index % colors.length])
      this.doc.setDrawColor(...colors[index % colors.length])

      // Create pie slice
      const steps = 30
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

    // Legend on the right with better formatting
    const legendX = x + width * 0.58
    const legendY = y + 35

    data.slice(0, 5).forEach((item, index) => {
      // Color box with border
      this.doc.setFillColor(...colors[index % colors.length])
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(0.2)
      this.doc.rect(legendX, legendY + index * 12, 6, 6, "FD")

      // Label
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      const percentage = ((item.amount / total) * 100).toFixed(1)
      const label = safeText(item.name).substring(0, 14)
      this.doc.text(`${label}`, legendX + 9, legendY + index * 12 + 5)

      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.primary)
      this.doc.text(`%${percentage}`, legendX + 60, legendY + index * 12 + 5)
    })
  }

  private drawProfessionalBarChart(x: number, y: number, width: number, height: number, title: string, credits: any[]) {
    // Chart container with shadow
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(210, 210, 210)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height, "FD")

    // Title with gradient background
    this.addGradientRect(x, y, width, 22, COLORS.lightGray, COLORS.white)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + width / 2, y + 14, { align: "center" })

    // Sort credits by interest rate
    const sortedCredits = [...credits].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0)).slice(0, 5)
    const maxRate = Math.max(...sortedCredits.map((c) => c.interestRate || 0))

    const barY = y + 32
    const barHeight = 12
    const maxBarWidth = width - 75

    const avgRate =
      this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length

    sortedCredits.forEach((credit, index) => {
      const rate = credit.interestRate || 0
      const barWidth = (rate / maxRate) * maxBarWidth

      // Bank name
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      const bankName = safeText(credit.bankName || "Diger").substring(0, 12)
      this.doc.text(bankName, x + 8, barY + index * 14 + 8)

      // Bar with gradient effect
      const barColor = rate > avgRate ? COLORS.danger : COLORS.success
      
      // Bar shadow
      this.doc.setFillColor(230, 230, 230)
      this.doc.rect(x + 50, barY + index * 14 + 3, barWidth, barHeight, "F")
      
      // Main bar
      this.doc.setFillColor(...barColor)
      this.doc.rect(x + 50, barY + index * 14 + 2, barWidth, barHeight, "F")

      // Lighter shade for 3D effect
      this.doc.setFillColor(...barColor)
      this.doc.setGState(this.doc.GState({ opacity: 0.4 }))
      this.doc.rect(x + 50, barY + index * 14 + 2, barWidth, barHeight / 2, "F")
      this.doc.setGState(this.doc.GState({ opacity: 1 }))

      // Rate value
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${rate.toFixed(2)}`, x + 52 + barWidth, barY + index * 14 + 9)
    })

    // Average line
    const avgLineX = x + 50 + (avgRate / maxRate) * maxBarWidth

    this.doc.setDrawColor(...COLORS.warning)
    this.doc.setLineWidth(0.8)
    this.doc.setLineDash([3, 2], 0)
    this.doc.line(avgLineX, barY - 2, avgLineX, barY + 65)
    this.doc.setLineDash([], 0)

    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("ORT", avgLineX - 6, barY - 4)
  }

  private drawProfessionalProgressChart(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    credits: any[],
  ) {
    // Chart container with shadow
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(210, 210, 210)
    this.doc.setLineWidth(0.5)
    this.doc.rect(x, y, width, height, "FD")

    // Title with gradient background
    this.addGradientRect(x, y, width, 20, COLORS.lightGray, COLORS.white)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + width / 2, y + 13, { align: "center" })

    // Progress bars
    const barY = y + 28
    const maxItems = Math.min(credits.length, 4)
    const barHeight = 10
    const barWidth = width - 130

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
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      const label = `${safeText(credit.bankName || "").substring(0, 14)} - ${safeText(credit.creditType || "").substring(0, 10)}`
      this.doc.text(label, x + 8, barY + i * 13 + 7)

      // Progress bar background
      this.doc.setFillColor(240, 240, 240)
      this.doc.roundedRect(x + 85, barY + i * 13 + 2, barWidth, barHeight, 2, 2, "F")

      // Progress bar fill with gradient effect
      const fillColor =
        progressPercentage > 75 ? COLORS.success : progressPercentage > 50 ? COLORS.warning : COLORS.danger
      
      this.doc.setFillColor(...fillColor)
      this.doc.roundedRect(x + 85, barY + i * 13 + 2, (barWidth * progressPercentage) / 100, barHeight, 2, 2, "F")
      
      // Lighter overlay for 3D effect
      this.doc.setFillColor(...fillColor)
      this.doc.setGState(this.doc.GState({ opacity: 0.3 }))
      this.doc.roundedRect(x + 85, barY + i * 13 + 2, (barWidth * progressPercentage) / 100, barHeight / 2, 2, 2, "F")
      this.doc.setGState(this.doc.GState({ opacity: 1 }))

      // Percentage text
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${progressPercentage.toFixed(0)}`, x + 87 + barWidth, barY + i * 13 + 8)
    })
  }

  private addCompactInsights() {
    this.currentY += 10

    // Check page break
    this.checkPageBreak(70)

    // Insights header with gradient background
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      25,
      COLORS.success,
      COLORS.primary,
    )
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("ONEMLI BILGILER VE ONERILER", this.margin + 12, this.currentY + 16)

    this.currentY += 35

    // Insights box with shadow
    this.doc.setFillColor(248, 250, 252)
    this.doc.rect(this.margin + 2, this.currentY + 2, this.pageWidth - 2 * this.margin, 45, "F")
    
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(220, 220, 220)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 45, "FD")

    // Two column insights with icons
    const colWidth = (this.pageWidth - 2 * this.margin) / 2

    const leftInsights = [
      `En yuksek faiz: ${this.data.credits?.length > 0 ? "%" + Math.max(...this.data.credits.map((c: any) => c.interestRate || 0)).toFixed(2) : "N/A"}`,
      `En dusuk faiz: ${this.data.credits?.length > 0 ? "%" + Math.min(...this.data.credits.map((c: any) => c.interestRate || 0)).toFixed(2) : "N/A"}`,
      `Ortalama vade: ${this.data.credits?.length > 0 ? Math.round(this.data.credits.reduce((sum: number, c: any) => sum + (c.total_installments || 0), 0) / this.data.credits.length) + " ay" : "N/A"}`,
    ]

    const rightInsights = [
      `Aktif kredi: ${this.data.activeCredits || 0} adet`,
      `Toplam banka: ${new Set(this.data.credits?.map((c: any) => c.bankName)).size || 0} adet`,
      `Rapor tarihi: ${formatDate(new Date())}`,
    ]

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")

    leftInsights.forEach((insight, index) => {
      // Bullet point
      this.doc.setFillColor(...COLORS.primary)
      this.doc.circle(this.margin + 10, this.currentY + 8 + index * 12, 2, "F")
      
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(insight, this.margin + 18, this.currentY + 10 + index * 12)
    })

    rightInsights.forEach((insight, index) => {
      // Bullet point
      this.doc.setFillColor(...COLORS.secondary)
      this.doc.circle(this.margin + colWidth + 10, this.currentY + 8 + index * 12, 2, "F")
      
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(insight, this.margin + colWidth + 18, this.currentY + 10 + index * 12)
    })
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      // Footer background with gradient
      this.addGradientRect(0, this.pageHeight - 25, this.pageWidth, 25, COLORS.primary, COLORS.accent)

      // Footer content
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(8)

      // Left - Website
      this.doc.setFont("helvetica", "bold")
      this.doc.text("www.kreditakip.com.tr", this.margin, this.pageHeight - 10)

      // Center - Tagline
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Finansal ozgurluge giden yol", this.pageWidth / 2, this.pageHeight - 10, { align: "center" })

      // Right - Page number with total
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`Sayfa ${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 10, { align: "right" })
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 40) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = 25
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
      // Logo'yu yüklemeyi dene - boyut bilgileriyle birlikte
      this.logoData = await loadImageAsBase64("/logo-white.png")
      
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
        this.addModernSection("KREDI DETAYLARI", "primary")

        for (const [index, credit] of this.data.credits.entries()) {
          await this.addCreditCard(credit, index)
        }
      }

      // Banka Dagilimi
      this.addModernSection("BANKA DAGILIMI", "info", true)
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
      this.addModernSection("KREDI TURU DAGILIMI", "secondary")
      const typeDist = this.calculateCreditTypeDistribution()
      if (typeDist.length > 0) {
        const headers = ["Kredi Turu", "Adet", "Toplam Tutar", "Oran"]
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
        this.addModernSection("FAIZ ANALIZI", "warning", true)
        const headers = ["Banka", "Kredi Turu", "Faiz Orani", "Aylik Faiz", "Yillik Faiz"]
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

      // Rapor Özeti ve Grafikler
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
          payment_progress: data.dynamicStats?.paymentProgress || 0,
          total_installments: data.credit?.total_installments || 0,
          remaining_installments: data.dynamicStats?.remainingInstallments || data.credit?.remaining_installments || 0,
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
