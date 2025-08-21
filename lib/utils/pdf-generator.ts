import { COLORS } from "./colors"
import { safeText } from "./text-utils"
import { formatCurrency } from "./currency-utils"
import { format } from "./date-utils"

class PDFGenerator {
  private doc: any
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private data: any

  constructor(doc: any, data: any) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
    this.data = data
  }

  private addMetricCards(
    metrics: Array<{ title: string; value: string; subtitle?: string; color?: keyof typeof COLORS }>,
  ) {
    this.checkPageBreak(120) // Increased height for 2x2 layout

    const topRowMetrics = metrics.slice(0, 2)
    const bottomRowMetrics = metrics.slice(2, 4)

    const cardWidth = (this.pageWidth - 2 * this.margin - 20) / 2 // Width for 2 cards per row
    const cardHeight = 55 // Slightly increased height

    // Top row cards
    topRowMetrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 20)
      const color = COLORS[metric.color || "primary"]

      // Enhanced card background with gradient effect
      this.doc.setFillColor(255, 255, 255)
      this.doc.setDrawColor(220, 220, 220)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 4, 4, "FD")

      // Enhanced color accent bar
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 4, "F")

      // Value with larger font
      this.doc.setFontSize(20) // Increased from 16 to 20
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...color)
      this.doc.text(safeText(metric.value), x + cardWidth / 2, this.currentY + 25, { align: "center" })

      // Title with better spacing
      this.doc.setFontSize(11) // Increased from 9 to 11
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(safeText(metric.title), x + cardWidth / 2, this.currentY + 38, { align: "center" })

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(9) // Increased from 7 to 9
        this.doc.setTextColor(75, 85, 99)
        this.doc.text(safeText(metric.subtitle), x + cardWidth / 2, this.currentY + 48, { align: "center" })
      }
    })

    this.currentY += cardHeight + 15 // Space between rows

    // Bottom row cards
    bottomRowMetrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 20)
      const color = COLORS[metric.color || "primary"]

      // Enhanced card background
      this.doc.setFillColor(255, 255, 255)
      this.doc.setDrawColor(220, 220, 220)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 4, 4, "FD")

      // Enhanced color accent bar
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 4, "F")

      // Value with larger font
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...color)
      this.doc.text(safeText(metric.value), x + cardWidth / 2, this.currentY + 25, { align: "center" })

      // Title with better spacing
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(safeText(metric.title), x + cardWidth / 2, this.currentY + 38, { align: "center" })

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(9)
        this.doc.setTextColor(75, 85, 99)
        this.doc.text(safeText(metric.subtitle), x + cardWidth / 2, this.currentY + 48, { align: "center" })
      }
    })

    this.currentY += cardHeight + 25 // More space after cards
  }

  private addTable(
    headers: string[],
    rows: string[][],
    options?: { headerColor?: keyof typeof COLORS; alternateRows?: boolean; bankNames?: string[] },
  ) {
    const opts = { headerColor: "primary" as keyof typeof COLORS, alternateRows: true, bankNames: [], ...options }
    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length
    const rowHeight = 15 // Increased from 12 to 15 for better readability

    this.checkPageBreak((rows.length + 2) * rowHeight)

    // Enhanced header with gradient effect
    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 2, 2, "F")

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(11) // Increased from 9 to 11
    this.doc.setFont("helvetica", "bold")

    headers.forEach((header, i) => {
      this.doc.text(safeText(header), this.margin + i * colWidth + 5, this.currentY + 10)
    })

    this.currentY += rowHeight

    // Enhanced rows with better typography
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(10) // Increased from 8 to 10 for much better readability

    rows.forEach((row, rowIndex) => {
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252) // Lighter alternating color
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 1, 1, "F")
      }

      row.forEach((cell, colIndex) => {
        // If this is the first column (bank name) and we have bank names, add logo
        if (colIndex === 0 && opts.bankNames && opts.bankNames[rowIndex]) {
          this.addBankLogo(this.margin + colIndex * colWidth + 5, this.currentY + 3, opts.bankNames[rowIndex], 10)
          this.doc.setTextColor(0, 0, 0)
          this.doc.text(safeText(cell), this.margin + colIndex * colWidth + 20, this.currentY + 10)
        } else {
          this.doc.setTextColor(0, 0, 0)
          this.doc.text(safeText(cell), this.margin + colIndex * colWidth + 5, this.currentY + 10)
        }
      })

      this.currentY += rowHeight

      if (this.currentY > this.pageHeight - 50) {
        this.addPage()
      }
    })

    this.currentY += 15 // More space after table
  }

  private addCreditDetails(credit: any, index: number) {
    this.doc.setFillColor(248, 250, 252) // Lighter background
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 3, 3, "F")

    // Bank logo and name with better positioning
    this.addBankLogo(this.margin + 8, this.currentY + 3, credit.bankName, 10) // Larger logo
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(12) // Increased from 10 to 12
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${safeText(credit.bankName)} - ${safeText(credit.creditType)}`, this.margin + 25, this.currentY + 10)

    this.currentY += 25 // More space

    // Calculate additional metrics
    const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
    const yearlyInterest = monthlyInterest * 12
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const paymentProgress = credit.amount ? ((paidAmount / credit.amount) * 100).toFixed(1) : "0"
    const remainingMonths = credit.monthlyPayment ? Math.ceil((credit.remainingDebt || 0) / credit.monthlyPayment) : 0

    // Two column layout for details with better spacing
    const leftColX = this.margin + 15 // Better margins
    const rightColX = this.margin + (this.pageWidth - 2 * this.margin) / 2 + 15
    let detailY = this.currentY

    this.doc.setFontSize(10) // Increased from 8 to 10
    this.doc.setFont("helvetica", "normal")

    // Left column with enhanced formatting
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(16, 185, 129) // Color for section headers
    this.doc.text("Finansal Bilgiler:", leftColX, detailY)
    detailY += 10 // More space

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Baslangic Tutari: ${formatCurrency(credit.amount || 0)}`, leftColX, detailY)
    detailY += 8 // Increased spacing
    this.doc.text(`Kalan Borc: ${formatCurrency(credit.remainingDebt || 0)}`, leftColX, detailY)
    detailY += 8
    this.doc.text(`Odenen Tutar: ${formatCurrency(paidAmount)}`, leftColX, detailY)
    detailY += 8
    this.doc.text(`Odeme Orani: %${paymentProgress}`, leftColX, detailY)
    detailY += 8
    this.doc.text(`Aylik Odeme: ${formatCurrency(credit.monthlyPayment || 0)}`, leftColX, detailY)
    detailY += 15 // More space between sections

    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(59, 130, 246) // Different color for interest section
    this.doc.text("Faiz Bilgileri:", leftColX, detailY)
    detailY += 10

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Faiz Orani: %${(credit.interestRate || 0).toFixed(2)}`, leftColX, detailY)
    detailY += 8
    this.doc.text(`Aylik Faiz: ${formatCurrency(monthlyInterest)}`, leftColX, detailY)
    detailY += 8
    this.doc.text(`Yillik Faiz: ${formatCurrency(yearlyInterest)}`, leftColX, detailY)

    // Right column with enhanced formatting
    detailY = this.currentY
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(147, 51, 234) // Purple for installment section
    this.doc.text("Taksit Bilgileri:", rightColX, detailY)
    detailY += 10

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    if (credit.totalInstallments) {
      const paidInstallments = (credit.totalInstallments || 0) - (credit.remainingInstallments || 0)
      this.doc.text(`Toplam Taksit: ${credit.totalInstallments}`, rightColX, detailY)
      detailY += 8
      this.doc.text(`Odenen Taksit: ${paidInstallments}`, rightColX, detailY)
      detailY += 8
      this.doc.text(`Kalan Taksit: ${credit.remainingInstallments || 0}`, rightColX, detailY)
    } else {
      this.doc.text(`Tahmini Kalan Ay: ${remainingMonths}`, rightColX, detailY)
      detailY += 8
      this.doc.text("Taksit bilgisi mevcut degil", rightColX, detailY)
    }
    detailY += 15

    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(245, 158, 11) // Amber for date section
    this.doc.text("Tarih Bilgileri:", rightColX, detailY)
    detailY += 10

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    if (credit.startDate) {
      const startDate = new Date(credit.startDate)
      this.doc.text(`Baslangic: ${format(startDate, "dd/MM/yyyy")}`, rightColX, detailY)
      detailY += 8
    }
    if (credit.endDate) {
      const endDate = new Date(credit.endDate)
      this.doc.text(`Bitis: ${format(endDate, "dd/MM/yyyy")}`, rightColX, detailY)
      detailY += 8
    }
    if (!credit.startDate && !credit.endDate) {
      this.doc.text("Tarih bilgisi mevcut degil", rightColX, detailY)
      detailY += 8
    }

    // Status with color coding
    this.doc.setFont("helvetica", "bold")
    if (credit.status === "active") {
      this.doc.setTextColor(16, 185, 129) // Green for active
      this.doc.text("Durum: Aktif", rightColX, detailY)
    } else {
      this.doc.setTextColor(107, 114, 128) // Gray for closed
      this.doc.text("Durum: Kapali", rightColX, detailY)
    }

    this.currentY = Math.max(detailY, this.currentY + 80) + 20 // More space

    // Enhanced separator line
    if (index < Math.min(this.data.credits.length - 1, 9)) {
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(1) // Slightly thicker line
      this.doc.line(this.margin + 10, this.currentY - 10, this.pageWidth - this.margin - 10, this.currentY - 10)
    }
  }

  private addSection(title: string, content: () => void, color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(80)

    const sectionY = this.currentY

    // Enhanced section header with modern styling
    this.doc.setFillColor(...COLORS[color])
    this.doc.roundedRect(this.margin, sectionY, this.pageWidth - 2 * this.margin, 18, 3, 3, "F")

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(14) // Increased from 12 to 14
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + 10, sectionY + 12)

    this.currentY = sectionY + 28 // Increased spacing

    // Content area with better styling
    this.doc.setTextColor(0, 0, 0)
    content()

    this.currentY += 20 // Increased spacing after section
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - this.margin) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.currentY = this.margin
  }

  private addBankLogo(x: number, y: number, bankName: string, size: number) {
    // Placeholder for bank logo addition
    this.doc.text(bankName, x, y)
  }

  private format(date: Date, formatString: string): string {
    // Placeholder for date formatting
    return date.toLocaleDateString()
  }
}
