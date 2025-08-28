import { jsPDF } from "jspdf"
import { format } from "date-fns"

const COLORS = {
  primary: [59, 130, 246] as [number, number, number], // Blue
  secondary: [107, 114, 128] as [number, number, number], // Gray
  success: [16, 185, 129] as [number, number, number], // Green
  warning: [245, 158, 11] as [number, number, number], // Amber
  danger: [239, 68, 68] as [number, number, number], // Red
  info: [147, 51, 234] as [number, number, number], // Purple
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
      if (this.currentY + rowHeight > this.pageHeight - 80) {
        this.addPage()
        // Re-add header on new page
        this.doc.setFillColor(...COLORS[opts.headerColor])
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 2, 2, "F")
        this.doc.setTextColor(255, 255, 255)
        this.doc.setFontSize(11)
        this.doc.setFont("helvetica", "bold")
        headers.forEach((header, i) => {
          this.doc.text(safeText(header), this.margin + i * colWidth + 5, this.currentY + 10)
        })
        this.currentY += rowHeight
        this.doc.setTextColor(0, 0, 0)
        this.doc.setFont("helvetica", "normal")
        this.doc.setFontSize(10)
      }

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
    })

    this.currentY += 20 // More space after table
  }

  private addCreditDetails(credit: any, index: number) {
    this.checkPageBreak(160) // Increased from 140 to 160

    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, 3, 3, "F")

    // Bank logo and name with better positioning
    this.addBankLogo(this.margin + 10, this.currentY + 4, credit.bankName, 12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${safeText(credit.bankName)} - ${safeText(credit.creditType)}`, this.margin + 30, this.currentY + 12)

    this.currentY += 35 // Increased from 28 to 35

    // Calculate additional metrics
    const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
    const yearlyInterest = monthlyInterest * 12
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const paymentProgress = credit.amount ? ((paidAmount / credit.amount) * 100).toFixed(1) : "0"
    const remainingMonths = credit.monthlyPayment ? Math.ceil((credit.remainingDebt || 0) / credit.monthlyPayment) : 0

    const leftColX = this.margin + 20
    const rightColX = this.margin + (this.pageWidth - 2 * this.margin) / 2 + 20
    let detailY = this.currentY

    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")

    // Left column - Financial Information
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(16, 185, 129)
    this.doc.text("Finansal Bilgiler:", leftColX, detailY)
    detailY += 15 // Increased from 12 to 15

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Baslangic Tutari: ${formatCurrency(credit.amount || 0)}`, leftColX, detailY)
    detailY += 12 // Increased from 10 to 12
    this.doc.text(`Kalan Borc: ${formatCurrency(credit.remainingDebt || 0)}`, leftColX, detailY)
    detailY += 12
    this.doc.text(`Odenen Tutar: ${formatCurrency(paidAmount)}`, leftColX, detailY)
    detailY += 12
    this.doc.text(`Odeme Orani: %${paymentProgress}`, leftColX, detailY)
    detailY += 12
    this.doc.text(`Aylik Odeme: ${formatCurrency(credit.monthlyPayment || 0)}`, leftColX, detailY)
    detailY += 22 // Increased from 18 to 22

    // Interest Information
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(59, 130, 246)
    this.doc.text("Faiz Bilgileri:", leftColX, detailY)
    detailY += 15 // Increased from 12 to 15

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Faiz Orani: %${(credit.interestRate || 0).toFixed(2)}`, leftColX, detailY)
    detailY += 12 // Increased from 10 to 12
    this.doc.text(`Aylik Faiz: ${formatCurrency(monthlyInterest)}`, leftColX, detailY)
    detailY += 12
    this.doc.text(`Yillik Faiz: ${formatCurrency(yearlyInterest)}`, leftColX, detailY)

    // Right column - Installment and Date Information
    let rightDetailY = this.currentY // Use separate variable for right column
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(147, 51, 234)
    this.doc.text("Taksit Bilgileri:", rightColX, rightDetailY)
    rightDetailY += 15 // Increased from 12 to 15

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    if (credit.totalInstallments) {
      const paidInstallments = (credit.totalInstallments || 0) - (credit.remainingInstallments || 0)
      this.doc.text(`Toplam Taksit: ${credit.totalInstallments}`, rightColX, rightDetailY)
      rightDetailY += 12 // Increased from 10 to 12
      this.doc.text(`Odenen Taksit: ${paidInstallments}`, rightColX, rightDetailY)
      rightDetailY += 12
      this.doc.text(`Kalan Taksit: ${credit.remainingInstallments || 0}`, rightColX, rightDetailY)
    } else {
      this.doc.text(`Tahmini Kalan Ay: ${remainingMonths}`, rightColX, rightDetailY)
      rightDetailY += 12
      this.doc.text("Taksit bilgisi mevcut degil", rightColX, rightDetailY)
    }
    rightDetailY += 22 // Increased from 18 to 22

    // Date Information
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(245, 158, 11)
    this.doc.text("Tarih Bilgileri:", rightColX, rightDetailY)
    rightDetailY += 15 // Increased from 12 to 15

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    if (credit.startDate) {
      const startDate = new Date(credit.startDate)
      this.doc.text(`Baslangic: ${format(startDate, "dd/MM/yyyy")}`, rightColX, rightDetailY)
      rightDetailY += 12 // Increased from 10 to 12
    }
    if (credit.endDate) {
      const endDate = new Date(credit.endDate)
      this.doc.text(`Bitis: ${format(endDate, "dd/MM/yyyy")}`, rightColX, rightDetailY)
      rightDetailY += 12
    }
    if (!credit.startDate && !credit.endDate) {
      this.doc.text("Tarih bilgisi mevcut degil", rightColX, rightDetailY)
      rightDetailY += 12
    }

    // Status with color coding
    this.doc.setFont("helvetica", "bold")
    if (credit.status === "active") {
      this.doc.setTextColor(16, 185, 129)
      this.doc.text("Durum: Aktif", rightColX, rightDetailY)
    } else {
      this.doc.setTextColor(107, 114, 128)
      this.doc.text("Durum: Kapali", rightColX, rightDetailY)
    }

    const finalY = Math.max(detailY, rightDetailY) + 35 // Increased spacing after content
    this.currentY = finalY

    // Enhanced separator line - only if not the last credit
    if (index < this.data.credits.length - 1) {
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin + 15, this.currentY - 15, this.pageWidth - this.margin - 15, this.currentY - 15)
      this.currentY += 10
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
    if (this.currentY + height > this.pageHeight - 60) {
      // Increased bottom margin
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.currentY = this.margin + 20 // Added extra top margin for new pages
  }

  private addBankLogo(x: number, y: number, bankName: string, size: number) {
    this.doc.setFillColor(59, 130, 246)
    this.doc.roundedRect(x, y, size, size, 2, 2, "F")

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(6)
    this.doc.setFont("helvetica", "bold")
    const initials = bankName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
    this.doc.text(initials, x + size / 2, y + size / 2 + 1, { align: "center" })
  }

  private format(date: Date, formatString: string): string {
    return format(date, formatString)
  }

  private addHeader() {
    // Clean white background with subtle border
    this.doc.setFillColor(255, 255, 255)
    this.doc.rect(0, 0, this.pageWidth, 60, "F")

    // Subtle bottom border
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(1)
    this.doc.line(0, 58, this.pageWidth, 58)

    // Main title - clean and minimal
    this.doc.setTextColor(30, 30, 30)
    this.doc.setFontSize(24)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(this.data.reportTitle || "Kredi Portfoy Raporu"), this.margin, 35)

    // Right side information - minimal and clean
    const rightX = this.pageWidth - this.margin - 120
    this.doc.setTextColor(100, 100, 100)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    const reportDate = format(new Date(), "dd.MM.yyyy")
    this.doc.text(reportDate, rightX, 25)

    if (this.data.userData?.name) {
      this.doc.text(safeText(this.data.userData.name), rightX, 40)
    }

    this.currentY = 80 // Clean spacing after header
  }

  private addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      // Simple top border line
      this.doc.setDrawColor(230, 230, 230)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.pageHeight - 30, this.pageWidth - this.margin, this.pageHeight - 30)

      // Left side - Simple branding
      this.doc.setTextColor(100, 100, 100)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("KrediTakip.com.tr", this.margin, this.pageHeight - 15)

      // Right side - Clean page numbers
      const pageText = `${i} / ${pageCount}`
      this.doc.setTextColor(100, 100, 100)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(pageText, this.pageWidth - this.margin - 30, this.pageHeight - 15)
    }
  }

  private calculateBankDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const bankMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const bankName = credit.bankName || "Bilinmeyen Banka"
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
      const creditType = credit.creditType || "Diger"
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
    console.log("[v0] Starting PDF generation with data:", this.data)

    try {
      // Add header
      this.addHeader()

      // Add summary metrics
      console.log("[v0] Adding summary metrics")
      const summaryMetrics = [
        {
          title: "Toplam Kredi",
          value: this.data.totalCredits?.toString() || "0",
          subtitle: `${this.data.activeCredits || 0} aktif, ${this.data.closedCredits || 0} kapali`,
          color: "primary" as keyof typeof COLORS,
        },
        {
          title: "Toplam Borc",
          value: formatCurrency(this.data.totalDebt || 0),
          subtitle: "Kalan borc miktari",
          color: "danger" as keyof typeof COLORS,
        },
        {
          title: "Aylik Odeme",
          value: formatCurrency(this.data.monthlyPayment || 0),
          subtitle: "Toplam aylik taksit",
          color: "warning" as keyof typeof COLORS,
        },
        {
          title: "Toplam Odeme",
          value: formatCurrency(this.data.totalPayment || 0),
          subtitle: "Baslangic kredi tutari",
          color: "success" as keyof typeof COLORS,
        },
      ]

      this.addMetricCards(summaryMetrics)

      // Add credit details section
      if (this.data.credits && this.data.credits.length > 0) {
        console.log("[v0] Adding credit details for", this.data.credits.length, "credits")
        this.addSection(
          "Kredi Detaylari",
          () => {
            this.data.credits.forEach((credit: any, index: number) => {
              this.addCreditDetails(credit, index)

              if ((index + 1) % 3 === 0 && index < this.data.credits.length - 1) {
                this.checkPageBreak(160)
              }
            })
          },
          "primary",
        )
      }

      // Add bank distribution analysis
      console.log("[v0] Adding bank distribution analysis")
      this.addSection(
        "Banka Dagilimi",
        () => {
          const bankDistribution = this.calculateBankDistribution()
          if (bankDistribution.length > 0) {
            const headers = ["Banka", "Kredi Sayisi", "Toplam Borc", "Oran"]
            const rows = bankDistribution.map((bank) => [
              bank.name,
              bank.count.toString(),
              formatCurrency(bank.amount),
              `%${bank.percentage.toFixed(1)}`,
            ])
            const bankNames = bankDistribution.map((bank) => bank.name)
            this.addTable(headers, rows, { headerColor: "info", alternateRows: true, bankNames })
          } else {
            this.doc.setFontSize(11)
            this.doc.text("Banka dagilim verisi bulunamadi.", this.margin + 20, this.currentY + 15)
            this.currentY += 35
          }
        },
        "info",
      )

      console.log("[v0] Adding credit type distribution")
      this.addSection(
        "Kredi Turu Dagilimi",
        () => {
          const typeDistribution = this.calculateCreditTypeDistribution()
          if (typeDistribution.length > 0) {
            const headers = ["Kredi Turu", "Adet", "Toplam Tutar", "Oran"]
            const rows = typeDistribution.map((type) => [
              type.type,
              type.count.toString(),
              formatCurrency(type.amount),
              `%${type.percentage.toFixed(1)}`,
            ])
            this.addTable(headers, rows, { headerColor: "secondary", alternateRows: true })
          } else {
            this.doc.setFontSize(11)
            this.doc.text("Kredi turu dagilim verisi bulunamadi.", this.margin + 20, this.currentY + 15)
            this.currentY += 35
          }
        },
        "secondary",
      )

      // Add interest analysis
      console.log("[v0] Adding interest analysis")
      this.addSection(
        "Faiz Analizi",
        () => {
          if (this.data.credits && this.data.credits.length > 0) {
            const headers = ["Banka", "Kredi Turu", "Faiz Orani", "Aylik Faiz", "Yillik Faiz"]
            const rows = this.data.credits.map((credit: any) => {
              const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
              const yearlyInterest = monthlyInterest * 12
              return [
                credit.bankName || "Bilinmeyen",
                credit.creditType || "Diger",
                `%${(credit.interestRate || 0).toFixed(2)}`,
                formatCurrency(monthlyInterest),
                formatCurrency(yearlyInterest),
              ]
            })
            this.addTable(headers, rows, { headerColor: "warning", alternateRows: true })
          }
        },
        "warning",
      )

      // Add report summary section
      console.log("[v0] Adding report summary")
      this.addSection(
        "Rapor Ozeti",
        () => {
          this.doc.setFontSize(11)
          this.doc.setTextColor(0, 0, 0)

          const totalInterest =
            this.data.credits?.reduce((sum: number, credit: any) => {
              const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
              return sum + monthlyInterest * 12
            }, 0) || 0

          const avgInterestRate =
            this.data.credits?.length > 0
              ? this.data.credits.reduce((sum: number, credit: any) => sum + (credit.interestRate || 0), 0) /
                this.data.credits.length
              : 0

          this.doc.text(
            `• Toplam ${this.data.totalCredits || 0} kredi ile ${formatCurrency(this.data.totalDebt || 0)} borc`,
            this.margin + 20,
            this.currentY,
          )
          this.currentY += 15
          this.doc.text(`• Ortalama faiz orani: %${avgInterestRate.toFixed(2)}`, this.margin + 20, this.currentY)
          this.currentY += 15
          this.doc.text(
            `• Yillik toplam faiz maliyeti: ${formatCurrency(totalInterest)}`,
            this.margin + 20,
            this.currentY,
          )
          this.currentY += 15
          this.doc.text(
            `• Aylik toplam odeme yukumlulugu: ${formatCurrency(this.data.monthlyPayment || 0)}`,
            this.margin + 20,
            this.currentY,
          )
          this.currentY += 25
        },
        "success",
      )

      // Add footer
      this.addFooter()

      console.log("[v0] PDF generation completed successfully")
    } catch (error) {
      console.error("[v0] Error during PDF generation:", error)
      throw error
    }
  }
}

export async function generatePDFReport(data: any): Promise<void> {
  console.log("[v0] generatePDFReport called with data:", data)

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    const generator = new PDFGenerator(doc, data)
    await generator.generate()

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm")
    const filename = `kredi-raporu-${timestamp}.pdf`

    console.log("[v0] Saving PDF as:", filename)
    doc.save(filename)

    console.log("[v0] PDF download initiated successfully")
  } catch (error) {
    console.error("[v0] Error in generatePDFReport:", error)
    throw error
  }
}
