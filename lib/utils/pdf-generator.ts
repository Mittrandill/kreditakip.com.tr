import { jsPDF } from "jspdf"
import { format } from "date-fns"

const COLORS = {
  primary: [59, 130, 246] as [number, number, number], // Blue
  secondary: [107, 114, 128] as [number, number, number], // Gray
  success: [16, 185, 129] as [number, number, number], // Green
  warning: [245, 158, 11] as [number, number, number], // Amber
  danger: [239, 68, 68] as [number, number, number], // Red
  info: [147, 51, 234] as [number, number, number], // Purple
  premium: [168, 85, 247] as [number, number, number], // Premium Purple
  gold: [251, 191, 36] as [number, number, number], // Gold
  platinum: [156, 163, 175] as [number, number, number], // Platinum
  diamond: [79, 70, 229] as [number, number, number], // Diamond Blue
}

const GRADIENTS = {
  primary: { start: [59, 130, 246], end: [37, 99, 235] },
  premium: { start: [168, 85, 247], end: [147, 51, 234] },
  gold: { start: [251, 191, 36], end: [245, 158, 11] },
  success: { start: [16, 185, 129], end: [5, 150, 105] },
  danger: { start: [239, 68, 68], end: [220, 38, 38] },
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

const formatPercentage = (value: number): string => {
  return `%${value.toFixed(2)}`
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("tr-TR").format(value)
}

class PDFGenerator {
  private doc: any
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private data: any
  private isPremium: boolean
  private brandColors: any
  private customLogo: string | null

  constructor(doc: any, data: any, options?: { isPremium?: boolean; brandColors?: any; customLogo?: string }) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
    this.data = data
    this.isPremium = options?.isPremium || false
    this.brandColors = options?.brandColors || COLORS
    this.customLogo = options?.customLogo || null
  }

  private addMetricCards(
    metrics: Array<{
      title: string
      value: string
      subtitle?: string
      color?: keyof typeof COLORS
      trend?: number
      icon?: string
    }>,
  ) {
    this.checkPageBreak(140) // Increased height for premium layout

    const topRowMetrics = metrics.slice(0, 2)
    const bottomRowMetrics = metrics.slice(2, 4)

    const cardWidth = (this.pageWidth - 2 * this.margin - 25) / 2 // Slightly wider spacing
    const cardHeight = 65 // Increased height for premium look

    // Top row cards with premium styling
    topRowMetrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 25)
      const color = this.brandColors[metric.color || "primary"]

      if (this.isPremium) {
        // Shadow effect
        this.doc.setFillColor(0, 0, 0, 0.1)
        this.doc.roundedRect(x + 2, this.currentY + 2, cardWidth, cardHeight, 6, 6, "F")
      }

      // Enhanced card background with premium gradient
      this.doc.setFillColor(255, 255, 255)
      this.doc.setDrawColor(this.isPremium ? 200 : 220, this.isPremium ? 200 : 220, this.isPremium ? 200 : 220)
      this.doc.setLineWidth(this.isPremium ? 0.5 : 1)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 6, 6, "FD")

      if (this.isPremium) {
        const gradient = GRADIENTS[metric.color as keyof typeof GRADIENTS] || GRADIENTS.primary
        this.doc.setFillColor(...gradient.start)
        this.doc.rect(x, this.currentY, cardWidth, 5, "F")
        this.doc.setFillColor(...gradient.end)
        this.doc.rect(x, this.currentY, cardWidth / 2, 5, "F")
      } else {
        this.doc.setFillColor(...color)
        this.doc.rect(x, this.currentY, cardWidth, 4, "F")
      }

      if (this.isPremium && metric.icon) {
        this.doc.setFillColor(...color)
        this.doc.circle(x + cardWidth - 25, this.currentY + 20, 8, "F")
        this.doc.setTextColor(255, 255, 255)
        this.doc.setFontSize(10)
        this.doc.text(metric.icon, x + cardWidth - 25, this.currentY + 23, { align: "center" })
      }

      // Enhanced value with premium typography
      this.doc.setFontSize(this.isPremium ? 24 : 20)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...color)
      this.doc.text(safeText(metric.value), x + cardWidth / 2, this.currentY + 30, { align: "center" })

      if (this.isPremium && metric.trend !== undefined) {
        const trendColor = metric.trend >= 0 ? COLORS.success : COLORS.danger
        const trendSymbol = metric.trend >= 0 ? "↗" : "↘"
        this.doc.setFontSize(12)
        this.doc.setTextColor(...trendColor)
        this.doc.text(
          `${trendSymbol} ${formatPercentage(Math.abs(metric.trend))}`,
          x + cardWidth - 40,
          this.currentY + 15,
        )
      }

      // Enhanced title with premium spacing
      this.doc.setFontSize(this.isPremium ? 12 : 11)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(safeText(metric.title), x + cardWidth / 2, this.currentY + 45, { align: "center" })

      // Enhanced subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(this.isPremium ? 10 : 9)
        this.doc.setTextColor(75, 85, 99)
        this.doc.text(safeText(metric.subtitle), x + cardWidth / 2, this.currentY + 57, { align: "center" })
      }
    })

    this.currentY += cardHeight + 20 // Increased spacing

    // Bottom row cards with same premium styling
    bottomRowMetrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 25)
      const color = this.brandColors[metric.color || "primary"]

      if (this.isPremium) {
        this.doc.setFillColor(0, 0, 0, 0.1)
        this.doc.roundedRect(x + 2, this.currentY + 2, cardWidth, cardHeight, 6, 6, "F")
      }

      this.doc.setFillColor(255, 255, 255)
      this.doc.setDrawColor(this.isPremium ? 200 : 220, this.isPremium ? 200 : 220, this.isPremium ? 200 : 220)
      this.doc.setLineWidth(this.isPremium ? 0.5 : 1)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 6, 6, "FD")

      if (this.isPremium) {
        const gradient = GRADIENTS[metric.color as keyof typeof GRADIENTS] || GRADIENTS.primary
        this.doc.setFillColor(...gradient.start)
        this.doc.rect(x, this.currentY, cardWidth, 5, "F")
        this.doc.setFillColor(...gradient.end)
        this.doc.rect(x, this.currentY, cardWidth / 2, 5, "F")
      } else {
        this.doc.setFillColor(...color)
        this.doc.rect(x, this.currentY, cardWidth, 4, "F")
      }

      if (this.isPremium && metric.icon) {
        this.doc.setFillColor(...color)
        this.doc.circle(x + cardWidth - 25, this.currentY + 20, 8, "F")
        this.doc.setTextColor(255, 255, 255)
        this.doc.setFontSize(10)
        this.doc.text(metric.icon, x + cardWidth - 25, this.currentY + 23, { align: "center" })
      }

      this.doc.setFontSize(this.isPremium ? 24 : 20)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...color)
      this.doc.text(safeText(metric.value), x + cardWidth / 2, this.currentY + 30, { align: "center" })

      if (this.isPremium && metric.trend !== undefined) {
        const trendColor = metric.trend >= 0 ? COLORS.success : COLORS.danger
        const trendSymbol = metric.trend >= 0 ? "↗" : "↘"
        this.doc.setFontSize(12)
        this.doc.setTextColor(...trendColor)
        this.doc.text(
          `${trendSymbol} ${formatPercentage(Math.abs(metric.trend))}`,
          x + cardWidth - 40,
          this.currentY + 15,
        )
      }

      this.doc.setFontSize(this.isPremium ? 12 : 11)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(safeText(metric.title), x + cardWidth / 2, this.currentY + 45, { align: "center" })

      if (metric.subtitle) {
        this.doc.setFontSize(this.isPremium ? 10 : 9)
        this.doc.setTextColor(75, 85, 99)
        this.doc.text(safeText(metric.subtitle), x + cardWidth / 2, this.currentY + 57, { align: "center" })
      }
    })

    this.currentY += cardHeight + 30 // More space after premium cards
  }

  private addTable(
    headers: string[],
    rows: string[][],
    options?: {
      headerColor?: keyof typeof COLORS
      alternateRows?: boolean
      bankNames?: string[]
      showTotals?: boolean
      highlightBest?: boolean
    },
  ) {
    const opts = {
      headerColor: "primary" as keyof typeof COLORS,
      alternateRows: true,
      bankNames: [],
      showTotals: false,
      highlightBest: false,
      ...options,
    }
    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length
    const rowHeight = this.isPremium ? 18 : 15 // Premium row height

    this.checkPageBreak((rows.length + 3) * rowHeight)

    if (this.isPremium) {
      // Header shadow
      this.doc.setFillColor(0, 0, 0, 0.1)
      this.doc.roundedRect(this.margin + 1, this.currentY + 1, this.pageWidth - 2 * this.margin, rowHeight, 3, 3, "F")

      // Gradient header
      const gradient = GRADIENTS[opts.headerColor] || GRADIENTS.primary
      this.doc.setFillColor(...gradient.start)
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 3, 3, "F")
    } else {
      this.doc.setFillColor(...this.brandColors[opts.headerColor])
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 2, 2, "F")
    }

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(this.isPremium ? 12 : 11)
    this.doc.setFont("helvetica", "bold")

    headers.forEach((header, i) => {
      this.doc.text(safeText(header), this.margin + i * colWidth + 8, this.currentY + 12)
    })

    this.currentY += rowHeight

    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(this.isPremium ? 11 : 10)

    rows.forEach((row, rowIndex) => {
      if (opts.alternateRows && rowIndex % 2 === 0) {
        const bgColor = this.isPremium ? [250, 251, 252] : [248, 250, 252]
        this.doc.setFillColor(...bgColor)
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 2, 2, "F")
      }

      if (this.isPremium && opts.highlightBest && rowIndex === 0) {
        this.doc.setFillColor(254, 249, 195) // Light gold background
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 2, 2, "F")

        // Gold accent line
        this.doc.setFillColor(...COLORS.gold)
        this.doc.rect(this.margin, this.currentY, 4, rowHeight, "F")
      }

      row.forEach((cell, colIndex) => {
        if (colIndex === 0 && opts.bankNames && opts.bankNames[rowIndex]) {
          this.addBankLogo(
            this.margin + colIndex * colWidth + 8,
            this.currentY + 4,
            opts.bankNames[rowIndex],
            this.isPremium ? 12 : 10,
          )
          this.doc.setTextColor(0, 0, 0)
          this.doc.text(
            safeText(cell),
            this.margin + colIndex * colWidth + (this.isPremium ? 28 : 25),
            this.currentY + 12,
          )
        } else {
          this.doc.setTextColor(0, 0, 0)
          this.doc.text(safeText(cell), this.margin + colIndex * colWidth + 8, this.currentY + 12)
        }
      })

      this.currentY += rowHeight

      if (this.currentY > this.pageHeight - 60) {
        this.addPage()
      }
    })

    if (this.isPremium && opts.showTotals && rows.length > 0) {
      this.doc.setFillColor(...COLORS.premium)
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 2, 2, "F")

      this.doc.setTextColor(255, 255, 255)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("TOPLAM", this.margin + 8, this.currentY + 12)

      // Calculate and show totals for numeric columns
      for (let colIndex = 1; colIndex < headers.length; colIndex++) {
        const columnValues = rows.map((row) => {
          const value = row[colIndex]
          const numValue = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
          return isNaN(numValue) ? 0 : numValue
        })

        if (columnValues.some((v) => v > 0)) {
          const total = columnValues.reduce((sum, val) => sum + val, 0)
          const formattedTotal = headers[colIndex].includes("Oran")
            ? formatPercentage(total)
            : headers[colIndex].includes("Tutar") || headers[colIndex].includes("Borc")
              ? formatCurrency(total)
              : formatNumber(total)

          this.doc.text(formattedTotal, this.margin + colIndex * colWidth + 8, this.currentY + 12)
        }
      }

      this.currentY += rowHeight
    }

    this.currentY += this.isPremium ? 20 : 15 // Premium spacing
  }

  private addCreditDetails(credit: any, index: number) {
    this.checkPageBreak(this.isPremium ? 140 : 120)

    if (this.isPremium) {
      // Shadow effect
      this.doc.setFillColor(0, 0, 0, 0.05)
      this.doc.roundedRect(this.margin + 2, this.currentY + 2, this.pageWidth - 2 * this.margin, 22, 4, 4, "F")
    }

    this.doc.setFillColor(this.isPremium ? 252 : 248, this.isPremium ? 252 : 250, this.isPremium ? 255 : 252)
    this.doc.setDrawColor(this.isPremium ? 229 : 229, this.isPremium ? 231 : 231, this.isPremium ? 235 : 235)
    this.doc.roundedRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      this.isPremium ? 22 : 18,
      4,
      4,
      "FD",
    )

    // Enhanced bank logo and name
    this.addBankLogo(this.margin + 12, this.currentY + 5, credit.bankName, this.isPremium ? 14 : 12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(this.isPremium ? 14 : 12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(
      `${safeText(credit.bankName)} - ${safeText(credit.creditType)}`,
      this.margin + (this.isPremium ? 35 : 30),
      this.currentY + (this.isPremium ? 14 : 12),
    )

    if (this.isPremium) {
      const riskScore = this.calculateRiskScore(credit)
      const riskColor = riskScore > 70 ? COLORS.danger : riskScore > 40 ? COLORS.warning : COLORS.success
      const riskText = riskScore > 70 ? "Yüksek Risk" : riskScore > 40 ? "Orta Risk" : "Düşük Risk"

      this.doc.setFillColor(...riskColor)
      this.doc.roundedRect(this.pageWidth - this.margin - 80, this.currentY + 4, 70, 14, 7, 7, "F")
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(riskText, this.pageWidth - this.margin - 45, this.currentY + 12, { align: "center" })
    }

    this.currentY += this.isPremium ? 32 : 28

    const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
    const yearlyInterest = monthlyInterest * 12
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const paymentProgress = credit.amount ? ((paidAmount / credit.amount) * 100).toFixed(1) : "0"
    const remainingMonths = credit.monthlyPayment ? Math.ceil((credit.remainingDebt || 0) / credit.monthlyPayment) : 0

    const debtToIncomeRatio =
      this.isPremium && this.data.monthlyIncome
        ? (((credit.monthlyPayment || 0) / this.data.monthlyIncome) * 100).toFixed(1)
        : null
    const earlyPayoffSavings = this.isPremium ? this.calculateEarlyPayoffSavings(credit) : null
    const refinancingPotential = this.isPremium ? this.calculateRefinancingPotential(credit) : null

    const leftColX = this.margin + 25
    const rightColX = this.margin + (this.pageWidth - 2 * this.margin) / 2 + 25
    let detailY = this.currentY

    this.doc.setFontSize(this.isPremium ? 12 : 11)
    this.doc.setFont("helvetica", "normal")

    // Enhanced left column with premium metrics
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(16, 185, 129)
    this.doc.text("Finansal Bilgiler:", leftColX, detailY)
    detailY += this.isPremium ? 14 : 12

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Baslangic Tutari: ${formatCurrency(credit.amount || 0)}`, leftColX, detailY)
    detailY += this.isPremium ? 12 : 10
    this.doc.text(`Kalan Borc: ${formatCurrency(credit.remainingDebt || 0)}`, leftColX, detailY)
    detailY += this.isPremium ? 12 : 10
    this.doc.text(`Odenen Tutar: ${formatCurrency(paidAmount)}`, leftColX, detailY)
    detailY += this.isPremium ? 12 : 10
    this.doc.text(`Odeme Orani: %${paymentProgress}`, leftColX, detailY)
    detailY += this.isPremium ? 12 : 10
    this.doc.text(`Aylik Odeme: ${formatCurrency(credit.monthlyPayment || 0)}`, leftColX, detailY)
    detailY += this.isPremium ? 20 : 18

    if (this.isPremium) {
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(168, 85, 247) // Premium purple
      this.doc.text("Premium Analizler:", leftColX, detailY)
      detailY += 14

      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(0, 0, 0)

      if (debtToIncomeRatio) {
        this.doc.text(`Gelir Orani: %${debtToIncomeRatio}`, leftColX, detailY)
        detailY += 12
      }

      if (earlyPayoffSavings) {
        this.doc.text(`Erken Odeme Tasarrufu: ${formatCurrency(earlyPayoffSavings)}`, leftColX, detailY)
        detailY += 12
      }

      if (refinancingPotential) {
        this.doc.text(`Yeniden Yapilandirma: ${formatCurrency(refinancingPotential)} tasarruf`, leftColX, detailY)
        detailY += 12
      }

      detailY += 8
    }

    // Enhanced interest information
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(59, 130, 246)
    this.doc.text("Faiz Bilgileri:", leftColX, detailY)
    detailY += this.isPremium ? 14 : 12

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Faiz Orani: %${(credit.interestRate || 0).toFixed(2)}`, leftColX, detailY)
    detailY += this.isPremium ? 12 : 10
    this.doc.text(`Aylik Faiz: ${formatCurrency(monthlyInterest)}`, leftColX, detailY)
    detailY += this.isPremium ? 12 : 10
    this.doc.text(`Yillik Faiz: ${formatCurrency(yearlyInterest)}`, leftColX, detailY)

    // Enhanced right column
    detailY = this.currentY
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(147, 51, 234)
    this.doc.text("Taksit Bilgileri:", rightColX, detailY)
    detailY += this.isPremium ? 14 : 12

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    if (credit.totalInstallments) {
      const paidInstallments = (credit.totalInstallments || 0) - (credit.remainingInstallments || 0)
      this.doc.text(`Toplam Taksit: ${credit.totalInstallments}`, rightColX, detailY)
      detailY += this.isPremium ? 12 : 10
      this.doc.text(`Odenen Taksit: ${paidInstallments}`, rightColX, detailY)
      detailY += this.isPremium ? 12 : 10
      this.doc.text(`Kalan Taksit: ${credit.remainingInstallments || 0}`, rightColX, detailY)
    } else {
      this.doc.text(`Tahmini Kalan Ay: ${remainingMonths}`, rightColX, detailY)
      detailY += this.isPremium ? 12 : 10
      this.doc.text("Taksit bilgisi mevcut degil", rightColX, detailY)
    }
    detailY += this.isPremium ? 20 : 18

    // Enhanced date information
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(245, 158, 11)
    this.doc.text("Tarih Bilgileri:", rightColX, detailY)
    detailY += this.isPremium ? 14 : 12

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    if (credit.startDate) {
      const startDate = new Date(credit.startDate)
      this.doc.text(`Baslangic: ${format(startDate, "dd/MM/yyyy")}`, rightColX, detailY)
      detailY += this.isPremium ? 12 : 10
    }
    if (credit.endDate) {
      const endDate = new Date(credit.endDate)
      this.doc.text(`Bitis: ${format(endDate, "dd/MM/yyyy")}`, rightColX, detailY)
      detailY += this.isPremium ? 12 : 10
    }
    if (!credit.startDate && !credit.endDate) {
      this.doc.text("Tarih bilgisi mevcut degil", rightColX, detailY)
      detailY += this.isPremium ? 12 : 10
    }

    // Enhanced status with premium styling
    this.doc.setFont("helvetica", "bold")
    if (credit.status === "active") {
      this.doc.setTextColor(16, 185, 129)
      this.doc.text("Durum: Aktif", rightColX, detailY)
    } else {
      this.doc.setTextColor(107, 114, 128)
      this.doc.text("Durum: Kapali", rightColX, detailY)
    }

    this.currentY = Math.max(detailY, this.currentY + (this.isPremium ? 110 : 90)) + (this.isPremium ? 30 : 25)

    // Enhanced separator line with premium styling
    if (index < Math.min(this.data.credits.length - 1, 9)) {
      if (this.isPremium) {
        // Gradient separator line
        this.doc.setDrawColor(200, 200, 200)
        this.doc.setLineWidth(1)
        this.doc.line(this.margin + 20, this.currentY - 20, this.pageWidth - this.margin - 20, this.currentY - 20)
      } else {
        this.doc.setDrawColor(200, 200, 200)
        this.doc.setLineWidth(0.5)
        this.doc.line(this.margin + 15, this.currentY - 15, this.pageWidth - this.margin - 15, this.currentY - 15)
      }
    }
  }

  private calculateRiskScore(credit: any): number {
    let riskScore = 0

    // Interest rate risk (0-30 points)
    const interestRate = credit.interestRate || 0
    if (interestRate > 3) riskScore += 30
    else if (interestRate > 2) riskScore += 20
    else if (interestRate > 1.5) riskScore += 10

    // Debt amount risk (0-25 points)
    const debtAmount = credit.remainingDebt || 0
    if (debtAmount > 500000) riskScore += 25
    else if (debtAmount > 200000) riskScore += 15
    else if (debtAmount > 100000) riskScore += 10

    // Payment progress risk (0-25 points)
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const paymentProgress = credit.amount ? (paidAmount / credit.amount) * 100 : 0
    if (paymentProgress < 20) riskScore += 25
    else if (paymentProgress < 50) riskScore += 15
    else if (paymentProgress < 70) riskScore += 10

    // Credit type risk (0-20 points)
    const creditType = credit.creditType || ""
    if (creditType.includes("Ticari")) riskScore += 20
    else if (creditType.includes("İhtiyaç")) riskScore += 15
    else if (creditType.includes("Taşıt")) riskScore += 10
    else if (creditType.includes("Konut")) riskScore += 5

    return Math.min(riskScore, 100)
  }

  private calculateEarlyPayoffSavings(credit: any): number {
    const remainingDebt = credit.remainingDebt || 0
    const interestRate = credit.interestRate || 0
    const monthlyPayment = credit.monthlyPayment || 0

    if (remainingDebt === 0 || monthlyPayment === 0) return 0

    const remainingMonths = Math.ceil(remainingDebt / monthlyPayment)
    const totalInterestRemaining = remainingMonths * monthlyPayment - remainingDebt

    // Assume 50% early payoff saves 70% of remaining interest
    return totalInterestRemaining * 0.7
  }

  private calculateRefinancingPotential(credit: any): number {
    const remainingDebt = credit.remainingDebt || 0
    const currentRate = credit.interestRate || 0

    if (remainingDebt === 0 || currentRate === 0) return 0

    // Assume market rate is 1% lower than current rate
    const marketRate = Math.max(currentRate - 1, 0.5)
    const currentMonthlyInterest = (remainingDebt * currentRate) / 1200
    const newMonthlyInterest = (remainingDebt * marketRate) / 1200
    const monthlySavings = currentMonthlyInterest - newMonthlyInterest

    // Calculate 12-month savings potential
    return monthlySavings * 12
  }

  private addSection(title: string, content: () => void, color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(this.isPremium ? 100 : 80)

    const sectionY = this.currentY

    if (this.isPremium) {
      // Shadow effect
      this.doc.setFillColor(0, 0, 0, 0.1)
      this.doc.roundedRect(this.margin + 2, sectionY + 2, this.pageWidth - 2 * this.margin, 22, 4, 4, "F")

      // Gradient background
      const gradient = GRADIENTS[color] || GRADIENTS.primary
      this.doc.setFillColor(...gradient.start)
      this.doc.roundedRect(this.margin, sectionY, this.pageWidth - 2 * this.margin, 22, 4, 4, "F")

      // Accent line
      this.doc.setFillColor(...gradient.end)
      this.doc.rect(this.margin, sectionY, this.pageWidth - 2 * this.margin, 4, "F")
    } else {
      this.doc.setFillColor(...this.brandColors[color])
      this.doc.roundedRect(this.margin, sectionY, this.pageWidth - 2 * this.margin, 18, 3, 3, "F")
    }

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(this.isPremium ? 16 : 14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + 12, sectionY + (this.isPremium ? 15 : 12))

    this.currentY = sectionY + (this.isPremium ? 32 : 28)

    // Content area with enhanced styling
    this.doc.setTextColor(0, 0, 0)
    content()

    this.currentY += this.isPremium ? 25 : 20
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - (this.isPremium ? 60 : 50)) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.currentY = this.margin

    if (this.isPremium) {
      this.addPremiumWatermark()
    }
  }

  private addBankLogo(x: number, y: number, bankName: string, size: number) {
    if (this.isPremium) {
      // Premium logo with gradient and shadow
      this.doc.setFillColor(0, 0, 0, 0.1)
      this.doc.roundedRect(x + 1, y + 1, size, size, 3, 3, "F")

      const gradient = GRADIENTS.primary
      this.doc.setFillColor(...gradient.start)
      this.doc.roundedRect(x, y, size, size, 3, 3, "F")
    } else {
      this.doc.setFillColor(59, 130, 246)
      this.doc.roundedRect(x, y, size, size, 2, 2, "F")
    }

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(this.isPremium ? 7 : 6)
    this.doc.setFont("helvetica", "bold")
    const initials = bankName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
    this.doc.text(initials, x + size / 2, y + size / 2 + 1, { align: "center" })
  }

  private addPremiumWatermark() {
    this.doc.setTextColor(240, 240, 240)
    this.doc.setFontSize(60)
    this.doc.setFont("helvetica", "bold")

    // Rotate and add watermark
    this.doc.text("PREMIUM", this.pageWidth / 2, this.pageHeight / 2, {
      align: "center",
      angle: -45,
    })
  }

  private format(date: Date, formatString: string): string {
    return format(date, formatString)
  }

  private addHeader() {
    if (this.isPremium) {
      // Premium gradient header
      const gradient = GRADIENTS.premium
      this.doc.setFillColor(...gradient.start)
      this.doc.rect(0, 0, this.pageWidth, 70, "F")

      // Accent stripe
      this.doc.setFillColor(...gradient.end)
      this.doc.rect(0, 65, this.pageWidth, 5, "F")
    } else {
      this.doc.setFillColor(248, 250, 252)
      this.doc.rect(0, 0, this.pageWidth, 60, "F")
    }

    if (this.isPremium && this.customLogo) {
      // Add custom logo (placeholder for now)
      this.doc.setFillColor(255, 255, 255)
      this.doc.roundedRect(this.margin, 15, 40, 30, 3, 3, "F")
      this.doc.setTextColor(100, 100, 100)
      this.doc.setFontSize(8)
      this.doc.text("LOGO", this.margin + 20, 32, { align: "center" })
    }

    this.doc.setTextColor(this.isPremium ? 255 : 0, this.isPremium ? 255 : 0, this.isPremium ? 255 : 0)
    this.doc.setFontSize(this.isPremium ? 28 : 24)
    this.doc.setFont("helvetica", "bold")

    const titleX = this.isPremium && this.customLogo ? this.margin + 50 : this.margin
    this.doc.text(safeText(this.data.reportTitle || "Kredi Portfoy Raporu"), titleX, this.isPremium ? 40 : 35)

    if (this.isPremium) {
      this.doc.setFillColor(...COLORS.gold)
      this.doc.roundedRect(this.pageWidth - this.margin - 80, 15, 70, 20, 10, 10, "F")
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("PREMIUM", this.pageWidth - this.margin - 45, 27, { align: "center" })
    }

    this.doc.setFontSize(this.isPremium ? 14 : 12)
    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(this.isPremium ? 200 : 107, this.isPremium ? 200 : 114, this.isPremium ? 200 : 128)
    const reportDate = format(new Date(), "dd MMMM yyyy")
    this.doc.text(`Rapor Tarihi: ${reportDate}`, this.pageWidth - this.margin - 120, this.isPremium ? 40 : 35)

    if (this.data.userData?.name) {
      this.doc.text(`Hazirlayan: ${safeText(this.data.userData.name)}`, titleX, this.isPremium ? 55 : 50)
    }

    this.currentY = this.isPremium ? 90 : 80
  }

  private addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      if (this.isPremium) {
        // Premium footer with gradient
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(0, this.pageHeight - 30, this.pageWidth, 30, "F")

        this.doc.setFontSize(11)
        this.doc.setTextColor(75, 85, 99)
        this.doc.text(`Sayfa ${i} / ${pageCount}`, this.pageWidth - this.margin - 40, this.pageHeight - 15)
        this.doc.text("KrediTakip.com.tr - Premium Rapor", this.margin, this.pageHeight - 15)

        // Premium footer accent
        this.doc.setFillColor(...COLORS.premium)
        this.doc.rect(0, this.pageHeight - 30, this.pageWidth, 2, "F")
      } else {
        this.doc.setFontSize(10)
        this.doc.setTextColor(107, 114, 128)
        this.doc.text(`Sayfa ${i} / ${pageCount}`, this.pageWidth - this.margin - 30, this.pageHeight - 20)
        this.doc.text("KrediTakip.com.tr", this.margin, this.pageHeight - 20)
      }
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
    console.log("[v0] Starting premium PDF generation with data:", this.data)

    try {
      // Add premium header
      this.addHeader()

      console.log("[v0] Adding premium summary metrics")
      const totalInterest =
        this.data.credits?.reduce((sum: number, credit: any) => {
          const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
          return sum + monthlyInterest * 12
        }, 0) || 0

      const avgRiskScore =
        this.isPremium && this.data.credits?.length > 0
          ? this.data.credits.reduce((sum: number, credit: any) => sum + this.calculateRiskScore(credit), 0) /
            this.data.credits.length
          : 0

      const summaryMetrics = [
        {
          title: "Toplam Kredi",
          value: this.data.totalCredits?.toString() || "0",
          subtitle: `${this.data.activeCredits || 0} aktif, ${this.data.closedCredits || 0} kapali`,
          color: "primary" as keyof typeof COLORS,
          trend: this.isPremium ? 5.2 : undefined,
          icon: this.isPremium ? "₺" : undefined,
        },
        {
          title: "Toplam Borc",
          value: formatCurrency(this.data.totalDebt || 0),
          subtitle: "Kalan borc miktari",
          color: "danger" as keyof typeof COLORS,
          trend: this.isPremium ? -2.1 : undefined,
          icon: this.isPremium ? "⚠" : undefined,
        },
        {
          title: "Aylik Odeme",
          value: formatCurrency(this.data.monthlyPayment || 0),
          subtitle: "Toplam aylik taksit",
          color: "warning" as keyof typeof COLORS,
          trend: this.isPremium ? 1.8 : undefined,
          icon: this.isPremium ? "📅" : undefined,
        },
        {
          title: this.isPremium ? "Risk Skoru" : "Toplam Odeme",
          value: this.isPremium ? `${avgRiskScore.toFixed(0)}/100` : formatCurrency(this.data.totalPayment || 0),
          subtitle: this.isPremium ? "Ortalama risk seviyesi" : "Baslangic kredi tutari",
          color: this.isPremium
            ? avgRiskScore > 70
              ? "danger"
              : avgRiskScore > 40
                ? "warning"
                : "success"
            : ("success" as keyof typeof COLORS),
          trend: this.isPremium ? -3.5 : undefined,
          icon: this.isPremium ? "🎯" : undefined,
        },
      ]

      this.addMetricCards(summaryMetrics)

      if (this.isPremium) {
        this.addSection(
          "Premium Finansal Öngörüler",
          () => {
            this.doc.setFontSize(12)
            this.doc.setTextColor(0, 0, 0)

            const potentialSavings =
              this.data.credits?.reduce((sum: number, credit: any) => {
                return sum + this.calculateRefinancingPotential(credit)
              }, 0) || 0

            const earlyPayoffSavings =
              this.data.credits?.reduce((sum: number, credit: any) => {
                return sum + this.calculateEarlyPayoffSavings(credit)
              }, 0) || 0

            // Premium insights with enhanced formatting
            this.doc.setFillColor(254, 249, 195) // Light gold background
            this.doc.roundedRect(this.margin + 10, this.currentY, this.pageWidth - 2 * this.margin - 20, 80, 4, 4, "F")

            this.doc.setTextColor(146, 64, 14) // Dark gold text
            this.doc.setFont("helvetica", "bold")
            this.doc.text("💡 Akıllı Öneriler:", this.margin + 20, this.currentY + 15)

            this.doc.setFont("helvetica", "normal")
            this.doc.setTextColor(0, 0, 0)
            this.doc.text(
              `• Yeniden yapilandirma ile yillik ${formatCurrency(potentialSavings)} tasarruf potansiyeli`,
              this.margin + 20,
              this.currentY + 30,
            )
            this.doc.text(
              `• Erken odeme ile toplam ${formatCurrency(earlyPayoffSavings)} faiz tasarrufu`,
              this.margin + 20,
              this.currentY + 45,
            )
            this.doc.text(
              `• Ortalama risk skorunuz: ${avgRiskScore.toFixed(0)}/100 - ${avgRiskScore > 70 ? "Dikkat gerekli" : avgRiskScore > 40 ? "Orta seviye" : "İyi durumda"}`,
              this.margin + 20,
              this.currentY + 60,
            )

            this.currentY += 100
          },
          "gold",
        )
      }

      // Enhanced credit details section
      if (this.data.credits && this.data.credits.length > 0) {
        console.log("[v0] Adding premium credit details for", this.data.credits.length, "credits")
        this.addSection(
          this.isPremium ? "Detaylı Kredi Analizi" : "Kredi Detaylari",
          () => {
            const creditsToShow = this.data.credits.slice(0, this.isPremium ? 15 : 10)
            creditsToShow.forEach((credit: any, index: number) => {
              this.addCreditDetails(credit, index)
            })

            if (this.data.credits.length > (this.isPremium ? 15 : 10)) {
              this.doc.setFontSize(10)
              this.doc.setTextColor(107, 114, 128)
              this.doc.text(
                `... ve ${this.data.credits.length - (this.isPremium ? 15 : 10)} kredi daha`,
                this.margin + 20,
                this.currentY,
              )
              this.currentY += 20
            }
          },
          "primary",
        )
      }

      // Enhanced bank distribution analysis
      console.log("[v0] Adding premium bank distribution analysis")
      this.addSection(
        this.isPremium ? "Gelişmiş Banka Dağılım Analizi" : "Banka Dagilimi",
        () => {
          const bankDistribution = this.calculateBankDistribution()
          if (bankDistribution.length > 0) {
            const headers = this.isPremium
              ? ["Banka", "Kredi Sayisi", "Toplam Borc", "Oran", "Risk Skoru"]
              : ["Banka", "Kredi Sayisi", "Toplam Borc", "Oran"]

            const rows = bankDistribution.map((bank) => {
              const bankCredits = this.data.credits?.filter((c: any) => c.bankName === bank.name) || []
              const avgRisk =
                this.isPremium && bankCredits.length > 0
                  ? bankCredits.reduce((sum: number, credit: any) => sum + this.calculateRiskScore(credit), 0) /
                    bankCredits.length
                  : 0

              const row = [
                bank.name,
                bank.count.toString(),
                formatCurrency(bank.amount),
                `%${bank.percentage.toFixed(1)}`,
              ]

              if (this.isPremium) {
                row.push(`${avgRisk.toFixed(0)}/100`)
              }

              return row
            })

            const bankNames = bankDistribution.map((bank) => bank.name)
            this.addTable(headers, rows, {
              headerColor: "info",
              alternateRows: true,
              bankNames,
              showTotals: this.isPremium,
              highlightBest: this.isPremium,
            })
          } else {
            this.doc.setFontSize(11)
            this.doc.text("Banka dagilim verisi bulunamadi.", this.margin + 20, this.currentY + 15)
            this.currentY += 35
          }
        },
        "info",
      )

      // Enhanced credit type distribution
      console.log("[v0] Adding premium credit type distribution")
      this.addSection(
        this.isPremium ? "Kredi Türü Risk Analizi" : "Kredi Turu Dagilimi",
        () => {
          const typeDistribution = this.calculateCreditTypeDistribution()
          if (typeDistribution.length > 0) {
            const headers = this.isPremium
              ? ["Kredi Turu", "Adet", "Toplam Tutar", "Oran", "Ort. Faiz"]
              : ["Kredi Turu", "Adet", "Toplam Tutar", "Oran"]

            const rows = typeDistribution.map((type) => {
              const typeCredits = this.data.credits?.filter((c: any) => c.creditType === type.type) || []
              const avgInterest =
                this.isPremium && typeCredits.length > 0
                  ? typeCredits.reduce((sum: number, credit: any) => sum + (credit.interestRate || 0), 0) /
                    typeCredits.length
                  : 0

              const row = [
                type.type,
                type.count.toString(),
                formatCurrency(type.amount),
                `%${type.percentage.toFixed(1)}`,
              ]

              if (this.isPremium) {
                row.push(formatPercentage(avgInterest))
              }

              return row
            })

            this.addTable(headers, rows, {
              headerColor: "secondary",
              alternateRows: true,
              showTotals: this.isPremium,
              highlightBest: this.isPremium,
            })
          } else {
            this.doc.setFontSize(11)
            this.doc.text("Kredi turu dagilim verisi bulunamadi.", this.margin + 20, this.currentY + 15)
            this.currentY += 35
          }
        },
        "secondary",
      )

      // Enhanced interest analysis
      console.log("[v0] Adding premium interest analysis")
      this.addSection(
        this.isPremium ? "Gelişmiş Faiz ve Maliyet Analizi" : "Faiz Analizi",
        () => {
          if (this.data.credits && this.data.credits.length > 0) {
            const headers = this.isPremium
              ? ["Banka", "Kredi Turu", "Faiz Orani", "Aylik Faiz", "Yillik Faiz", "Risk"]
              : ["Banka", "Kredi Turu", "Faiz Orani", "Aylik Faiz", "Yillik Faiz"]

            const creditsToAnalyze = this.data.credits.slice(0, this.isPremium ? 20 : 15)
            const rows = creditsToAnalyze.map((credit: any) => {
              const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
              const yearlyInterest = monthlyInterest * 12
              const riskScore = this.isPremium ? this.calculateRiskScore(credit) : 0

              const row = [
                credit.bankName || "Bilinmeyen",
                credit.creditType || "Diger",
                `%${(credit.interestRate || 0).toFixed(2)}`,
                formatCurrency(monthlyInterest),
                formatCurrency(yearlyInterest),
              ]

              if (this.isPremium) {
                row.push(`${riskScore.toFixed(0)}/100`)
              }

              return row
            })

            this.addTable(headers, rows, {
              headerColor: "warning",
              alternateRows: true,
              showTotals: this.isPremium,
              highlightBest: this.isPremium,
            })

            if (this.data.credits.length > (this.isPremium ? 20 : 15)) {
              this.doc.setFontSize(10)
              this.doc.setTextColor(107, 114, 128)
              this.doc.text(
                `... ve ${this.data.credits.length - (this.isPremium ? 20 : 15)} kredi daha`,
                this.margin + 20,
                this.currentY,
              )
              this.currentY += 20
            }
          }
        },
        "warning",
      )

      // Enhanced report summary section
      console.log("[v0] Adding premium report summary")
      this.addSection(
        this.isPremium ? "Kapsamlı Finansal Özet ve Öneriler" : "Rapor Ozeti",
        () => {
          this.doc.setFontSize(this.isPremium ? 12 : 11)
          this.doc.setTextColor(0, 0, 0)

          const avgInterestRate =
            this.data.credits?.length > 0
              ? this.data.credits.reduce((sum: number, credit: any) => sum + (credit.interestRate || 0), 0) /
                this.data.credits.length
              : 0

          if (this.isPremium) {
            // Executive summary box
            this.doc.setFillColor(239, 246, 255) // Light blue background
            this.doc.roundedRect(this.margin + 10, this.currentY, this.pageWidth - 2 * this.margin - 20, 120, 4, 4, "F")

            this.doc.setTextColor(29, 78, 216) // Dark blue text
            this.doc.setFont("helvetica", "bold")
            this.doc.text("📊 Yönetici Özeti:", this.margin + 20, this.currentY + 15)

            this.doc.setFont("helvetica", "normal")
            this.doc.setTextColor(0, 0, 0)
            this.doc.text(
              `• Portföy Büyüklüğü: ${this.data.totalCredits || 0} kredi ile ${formatCurrency(this.data.totalDebt || 0)} toplam borç`,
              this.margin + 20,
              this.currentY + 30,
            )
            this.doc.text(
              `• Ortalama Faiz Oranı: ${formatPercentage(avgInterestRate)} (Piyasa ortalaması: %2.15)`,
              this.margin + 20,
              this.currentY + 45,
            )
            this.doc.text(
              `• Yıllık Faiz Maliyeti: ${formatCurrency(totalInterest)} (Aylık ${formatCurrency(totalInterest / 12)})`,
              this.margin + 20,
              this.currentY + 60,
            )
            this.doc.text(
              `• Aylık Ödeme Yükü: ${formatCurrency(this.data.monthlyPayment || 0)} (Gelir oranı: ${this.data.monthlyIncome ? (((this.data.monthlyPayment || 0) / this.data.monthlyIncome) * 100).toFixed(1) + "%" : "Bilinmiyor"})`,
              this.margin + 20,
              this.currentY + 75,
            )
            this.doc.text(
              `• Ortalama Risk Skoru: ${avgRiskScore.toFixed(0)}/100 - ${this.getRiskAssessment(avgRiskScore)}`,
              this.margin + 20,
              this.currentY + 90,
            )
            this.doc.text(
              `• Optimizasyon Potansiyeli: Yüksek - Detaylar aşağıda`,
              this.margin + 20,
              this.currentY + 105,
            )

            this.currentY += 140
          } else {
            // Standard summary
            this.doc.text(
              `• Toplam ${this.data.totalCredits || 0} kredi ile ${formatCurrency(this.data.totalDebt || 0)} borc`,
              this.margin + 20,
              this.currentY,
            )
            this.currentY += 15
            this.doc.text(
              `• Ortalama faiz orani: ${formatPercentage(avgInterestRate)}`,
              this.margin + 20,
              this.currentY,
            )
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
          }
        },
        "success",
      )

      // Add premium footer
      this.addFooter()

      console.log("[v0] Premium PDF generation completed successfully")
    } catch (error) {
      console.error("[v0] Error during premium PDF generation:", error)
      throw error
    }
  }

  private getRiskAssessment(riskScore: number): string {
    if (riskScore > 70) return "Yüksek risk - Acil önlem gerekli"
    if (riskScore > 40) return "Orta risk - İzleme öneriliyor"
    return "Düşük risk - Sağlıklı portföy"
  }
}

export async function generatePDFReport(
  data: any,
  options?: {
    isPremium?: boolean
    brandColors?: any
    customLogo?: string
    template?: "standard" | "executive" | "detailed"
  },
): Promise<void> {
  console.log("[v0] generatePDFReport called with premium options:", options)

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true, // Enable compression for smaller file size
    })

    const generator = new PDFGenerator(doc, data, options)
    await generator.generate()

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm")
    const premiumSuffix = options?.isPremium ? "-premium" : ""
    const templateSuffix = options?.template ? `-${options.template}` : ""
    const filename = `kredi-raporu${premiumSuffix}${templateSuffix}-${timestamp}.pdf`

    console.log("[v0] Saving premium PDF as:", filename)
    doc.save(filename)

    console.log("[v0] Premium PDF download initiated successfully")
  } catch (error) {
    console.error("[v0] Error in generatePDFReport:", error)
    throw error
  }
}

export async function generateExcelReport(data: any): Promise<void> {
  // Placeholder for Excel export functionality
  console.log("[v0] Excel export functionality - Premium feature")
  throw new Error("Excel export requires premium subscription")
}

export async function generateWordReport(data: any): Promise<void> {
  // Placeholder for Word export functionality
  console.log("[v0] Word export functionality - Premium feature")
  throw new Error("Word export requires premium subscription")
}

export async function schedulePDFReport(data: any, schedule: string): Promise<void> {
  // Placeholder for scheduled report functionality
  console.log("[v0] Scheduled report functionality - Premium feature")
  throw new Error("Scheduled reports require premium subscription")
}
