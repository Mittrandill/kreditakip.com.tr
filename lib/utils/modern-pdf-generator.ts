import { jsPDF } from "jspdf"
import { format } from "date-fns"

// Modern color palette - Emerald/Teal theme matching email
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

const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  return String(text).replace(/[ıİşŞçÇğĞüÜöÖ]/g, (match) => {
    const replacements: { [key: string]: string } = {
      ı: "i",
      İ: "I",
      ş: "s",
      Ş: "S",
      ç: "c",
      Ç: "C",
      ğ: "g",
      Ğ: "G",
      ü: "u",
      Ü: "U",
      ö: "o",
      Ö: "O",
    }
    return replacements[match] || match
  })
}

const formatCurrency = (amount: number): string => {
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " TL"
  )
}

class ModernPDFGenerator {
  private doc: any
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private data: any
  private pageNumber = 1

  constructor(doc: any, data: any) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 25
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
    // Simulate gradient with multiple rectangles
    const steps = 10
    const stepHeight = height / steps

    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio)
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio)
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio)

      this.doc.setFillColor(r, g, b)
      this.doc.rect(x, y + i * stepHeight, width, stepHeight, "F")
    }
  }

  private addModernHeader() {
    // Gradient header background
    this.addGradientRect(0, 0, this.pageWidth, 80, COLORS.primary, COLORS.accent)

    // White overlay pattern for modern look
    this.doc.setFillColor(255, 255, 255, 0.1)
    for (let i = 0; i < 5; i++) {
      this.doc.circle(this.pageWidth - 50 - i * 30, 40, 60, "F")
    }

    // Logo placeholder (white)
    this.doc.setFillColor(...COLORS.white)
    this.doc.roundedRect(this.margin, 25, 30, 30, 3, 3, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", this.margin + 15, 43, { align: "center" })

    // Report title
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI PORTFOY RAPORU", this.margin + 45, 40)

    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Detayli Finansal Analiz", this.margin + 45, 55)

    // Date and user info on right
    const rightX = this.pageWidth - this.margin - 100
    this.doc.setFontSize(10)
    this.doc.setTextColor(...COLORS.white)
    this.doc.text(format(new Date(), "dd MMMM yyyy"), rightX, 35)

    if (this.data.userData?.name) {
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(this.data.userData.name), rightX, 50)
    }

    this.currentY = 100
  }

  private addModernMetricCards(
    metrics: Array<{
      title: string
      value: string
      subtitle?: string
      color?: keyof typeof COLORS
      icon?: string
    }>,
  ) {
    this.checkPageBreak(80)

    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 70

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10)
      const color = COLORS[metric.color || "primary"]

      // Card background with subtle shadow effect
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(230, 230, 230)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 4, 4, "FD")

      // Top accent with gradient effect
      this.doc.setFillColor(...color)
      this.doc.roundedRect(x, this.currentY, cardWidth, 3, 4, 4, "F")

      // Icon background
      if (metric.icon) {
        this.doc.setFillColor(...color)
        this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
        this.doc.circle(x + cardWidth - 20, this.currentY + 25, 15, "F")
        this.doc.setGState(this.doc.GState({ opacity: 1 }))

        // Icon
        this.doc.setTextColor(...color)
        this.doc.setFontSize(16)
        this.doc.text(metric.icon, x + cardWidth - 20, this.currentY + 30, { align: "center" })
      }

      // Title
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 10, this.currentY + 20)

      // Value
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(safeText(metric.value), x + 10, this.currentY + 40)

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(safeText(metric.subtitle), x + 10, this.currentY + 55)
      }
    })

    this.currentY += cardHeight + 30
  }

  private addModernSection(title: string, icon = "", color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(40)

    // Section header with modern styling
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 5, 5, "F")

    // Colored accent bar
    this.doc.setFillColor(...COLORS[color])
    this.doc.roundedRect(this.margin, this.currentY, 4, 35, 2, 2, "F")

    // Icon
    if (icon) {
      this.doc.setTextColor(...COLORS[color])
      this.doc.setFontSize(18)
      this.doc.text(icon, this.margin + 15, this.currentY + 22)
    }

    // Title
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + (icon ? 35 : 15), this.currentY + 22)

    this.currentY += 45
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
    const rowHeight = 35
    const headerHeight = 40

    this.checkPageBreak(headerHeight + rows.length * rowHeight)

    // Modern header with gradient
    this.addGradientRect(this.margin, this.currentY, totalWidth, headerHeight, COLORS[opts.headerColor], COLORS.accent)

    // Header text
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      this.doc.text(safeText(header).toUpperCase(), xPos + 15, this.currentY + 25)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    // Table rows with modern styling
    rows.forEach((row, rowIndex) => {
      // Alternate row backgrounds
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      // Row border
      this.doc.setDrawColor(230, 230, 230)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

      // Row content
      xPos = this.margin
      row.forEach((cell, colIndex) => {
        // Special formatting for amounts
        if (colIndex === headers.length - 1 && cell.includes("TL")) {
          this.doc.setTextColor(...COLORS.primary)
          this.doc.setFont("helvetica", "bold")
        } else {
          this.doc.setTextColor(...COLORS.dark)
          this.doc.setFont("helvetica", "normal")
        }

        this.doc.setFontSize(10)
        this.doc.text(safeText(cell), xPos + 15, this.currentY + 22)
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 20
  }

  private addCreditCard(credit: any, index: number) {
    this.checkPageBreak(180)

    // Modern card container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(220, 220, 220)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 160, 8, 8, "FD")

    // Gradient header bar
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      35,
      COLORS.primary,
      COLORS.secondary,
    )

    // Bank icon circle
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(this.margin + 25, this.currentY + 18, 12, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    const initials =
      credit.bankName
        ?.split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2) || "BK"
    this.doc.text(initials, this.margin + 25, this.currentY + 22, { align: "center" })

    // Bank name and type
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${safeText(credit.bankName)} - ${safeText(credit.creditType)}`, this.margin + 45, this.currentY + 22)

    // Status badge
    const statusX = this.pageWidth - this.margin - 60
    if (credit.status === "active") {
      this.doc.setFillColor(236, 253, 245)
      this.doc.roundedRect(statusX, this.currentY + 10, 50, 18, 9, 9, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(9)
      this.doc.text("AKTIF", statusX + 25, this.currentY + 21, { align: "center" })
    } else {
      this.doc.setFillColor(243, 244, 246)
      this.doc.roundedRect(statusX, this.currentY + 10, 50, 18, 9, 9, "F")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text("KAPALI", statusX + 25, this.currentY + 21, { align: "center" })
    }

    this.currentY += 45

    // Content area
    const contentY = this.currentY
    const leftX = this.margin + 20
    const centerX = this.margin + (this.pageWidth - 2 * this.margin) / 3
    const rightX = this.margin + (2 * (this.pageWidth - 2 * this.margin)) / 3

    // Calculate metrics
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const progressPercentage = credit.amount ? (paidAmount / credit.amount) * 100 : 0
    const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200

    // Progress bar
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(leftX, contentY, this.pageWidth - 2 * this.margin - 40, 8, 4, 4, "F")
    this.doc.setFillColor(...COLORS.primary)
    this.doc.roundedRect(
      leftX,
      contentY,
      ((this.pageWidth - 2 * this.margin - 40) * progressPercentage) / 100,
      8,
      4,
      4,
      "F",
    )

    // Progress text
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.text(`%${progressPercentage.toFixed(1)} Odendi`, leftX, contentY - 5)

    this.currentY = contentY + 20

    // Three column layout
    // Left column - amounts
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.text("KREDI TUTARI", leftX, this.currentY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.amount || 0), leftX, this.currentY + 15)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KALAN BORC", leftX, this.currentY + 35)
    this.doc.setTextColor(...COLORS.danger)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.remainingDebt || 0), leftX, this.currentY + 50)

    // Center column - installments
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK ODEME", centerX, this.currentY)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.monthlyPayment || 0), centerX, this.currentY + 15)

    if (credit.totalInstallments) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("TAKSIT", centerX, this.currentY + 35)
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      const paidInstallments = credit.totalInstallments - (credit.remainingInstallments || 0)
      this.doc.text(`${paidInstallments} / ${credit.totalInstallments}`, centerX, this.currentY + 50)
    }

    // Right column - interest and dates
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("FAIZ ORANI", rightX, this.currentY)
    this.doc.setTextColor(...COLORS.info)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, rightX, this.currentY + 15)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK FAIZ", rightX, this.currentY + 35)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(monthlyInterest), rightX, this.currentY + 50)

    this.currentY = contentY + 115
  }

  private addSummarySection() {
    this.checkPageBreak(120)

    // Summary container
    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 100, 8, 8, "F")

    // Icon and title
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(20)
    this.doc.text("📊", this.margin + 20, this.currentY + 25)

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Ozet Bilgiler", this.margin + 45, this.currentY + 25)

    // Summary items
    const summaryY = this.currentY + 45
    const leftCol = this.margin + 30
    const rightCol = this.pageWidth / 2

    const totalInterest =
      this.data.credits?.reduce((sum: number, credit: any) => {
        const monthly = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
        return sum + monthly * 12
      }, 0) || 0

    const avgRate =
      this.data.credits?.length > 0
        ? this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length
        : 0

    // Left column items
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Toplam Kredi Sayisi:", leftCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` ${this.data.totalCredits || 0} adet`, leftCol + 80, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Ortalama Faiz Orani:", leftCol, summaryY + 20)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` %${avgRate.toFixed(2)}`, leftCol + 80, summaryY + 20)

    // Right column items
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Yillik Toplam Faiz:", rightCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` ${formatCurrency(totalInterest)}`, rightCol + 70, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Aylik Odeme Yuku:", rightCol, summaryY + 20)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` ${formatCurrency(this.data.monthlyPayment || 0)}`, rightCol + 70, summaryY + 20)

    this.currentY += 120
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      // Footer gradient bar
      this.addGradientRect(0, this.pageHeight - 30, this.pageWidth, 30, COLORS.primary, COLORS.accent)

      // Left side - branding
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 12)

      // Center - tagline
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Finansal ozgurlugunuze giden yol", this.pageWidth / 2, this.pageHeight - 12, { align: "center" })

      // Right side - page number
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 12, { align: "right" })
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
    this.currentY = this.margin + 20
  }

  public async generate() {
    try {
      // Modern header
      this.addModernHeader()

      // Summary metrics with icons
      const metrics = [
        {
          title: "Toplam Kredi",
          value: this.data.totalCredits?.toString() || "0",
          subtitle: `${this.data.activeCredits || 0} aktif`,
          color: "primary" as keyof typeof COLORS,
          icon: "📋",
        },
        {
          title: "Toplam Borc",
          value: formatCurrency(this.data.totalDebt || 0),
          subtitle: "Kalan",
          color: "danger" as keyof typeof COLORS,
          icon: "💰",
        },
        {
          title: "Aylik Odeme",
          value: formatCurrency(this.data.monthlyPayment || 0),
          subtitle: "Taksit",
          color: "warning" as keyof typeof COLORS,
          icon: "📅",
        },
        {
          title: "Toplam Kredi",
          value: formatCurrency(this.data.totalPayment || 0),
          subtitle: "Baslangic",
          color: "success" as keyof typeof COLORS,
          icon: "✓",
        },
      ]

      this.addModernMetricCards(metrics)

      // Credit details with modern cards
      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Kredi Detaylari", "💳", "primary")
        this.data.credits.forEach((credit: any, index: number) => {
          this.addCreditCard(credit, index)
          this.currentY += 20
        })
      }

      // Bank distribution
      this.addModernSection("Banka Dagilimi", "🏦", "info")
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
          columnWidths: [180, 60, 140, 80],
        })
      }

      // Summary section
      this.addModernSection("Rapor Ozeti", "📊", "success")
      this.addSummarySection()

      // Add footer to all pages
      this.addModernFooter()
    } catch (error) {
      console.error("PDF generation error:", error)
      throw error
    }
  }

  private calculateBankDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const bankMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const bankName = credit.bankName || "Bilinmeyen"
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
}

export async function generateModernPDF(data: any): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    const generator = new ModernPDFGenerator(doc, data)
    await generator.generate()

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm")
    const filename = `kredi-raporu-${timestamp}.pdf`

    doc.save(filename)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}
