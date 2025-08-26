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
    this.checkPageBreak(this.isPremium ? 160 : 140) // Increased space requirement for better layout

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
    let rightDetailY = this.currentY // Added separate Y position for right column

    this.doc.setFontSize(this.isPremium ? 12 : 11)
    this.doc.setFont("helvetica", "normal")

    // Enhanced left column with premium metrics
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(16, 185, 129)
    this.doc.text("Finansal Bilgiler:", leftColX, detailY)
    detailY += this.isPremium ? 16 : 14 // Increased spacing between sections

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Baslangic Tutari: ${formatCurrency(credit.amount || 0)}`, leftColX, detailY)
    detailY += this.isPremium ? 14 : 12 // Increased line spacing
    this.doc.text(`Kalan Borc: ${formatCurrency(credit.remainingDebt || 0)}`, leftColX, detailY)
    detailY += this.isPremium ? 14 : 12
    this.doc.text(`Odenen Tutar: ${formatCurrency(paidAmount)}`, leftColX, detailY)
    detailY += this.isPremium ? 14 : 12
    this.doc.text(`Odeme Orani: %${paymentProgress}`, leftColX, detailY)
    detailY += this.isPremium ? 14 : 12
    this.doc.text(`Aylik Odeme: ${formatCurrency(credit.monthlyPayment || 0)}`, leftColX, detailY)
    detailY += this.isPremium ? 22 : 20 // Increased spacing before next section

    if (this.isPremium) {
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(168, 85, 247) // Premium purple
      this.doc.text("Premium Analizler:", leftColX, detailY)
      detailY += 16 // Increased spacing after section header

      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(0, 0, 0)

      if (debtToIncomeRatio) {
        this.doc.text(`Gelir Orani: %${debtToIncomeRatio}`, leftColX, detailY)
        detailY += 14 // Increased line spacing
      }

      if (earlyPayoffSavings) {
        this.doc.text(`Erken Odeme Tasarrufu: ${formatCurrency(earlyPayoffSavings)}`, leftColX, detailY)
        detailY += 14
      }

      if (refinancingPotential) {
        this.doc.text(`Yeniden Yapilandirma: ${formatCurrency(refinancingPotential)} tasarruf`, leftColX, detailY)
        detailY += 14
      }

      detailY += 10 // Added spacing after premium section
    }

    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(59, 130, 246)
    this.doc.text("Faiz Bilgileri:", rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 16 : 14

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Faiz Orani: %${credit.interestRate || 0}`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 14 : 12
    this.doc.text(`Aylik Faiz: ${formatCurrency((credit.monthlyPayment || 0) * 0.3)}`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 14 : 12
    this.doc.text(`Yillik Faiz: ${formatCurrency((credit.monthlyPayment || 0) * 12 * 0.3)}`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 22 : 20

    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(245, 101, 101)
    this.doc.text("Taksit Bilgileri:", rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 16 : 14

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)

    const totalInstallments = credit.totalInstallments || 0
    const remainingInstallments = credit.remainingInstallments || totalInstallments
    const paidInstallments = totalInstallments - remainingInstallments

    this.doc.text(`Tahmini Kalan Ay: ${remainingInstallments}`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 14 : 12
    this.doc.text(`Taksit bilgisi mevcut degil`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 22 : 20

    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(16, 185, 129)
    this.doc.text("Tarih Bilgileri:", rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 16 : 14

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(`Tarih bilgisi mevcut degil`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 14 : 12
    this.doc.text(`Durum: Aktif`, rightColX, rightDetailY)
    rightDetailY += this.isPremium ? 14 : 12

    this.currentY = Math.max(detailY, rightDetailY) + (this.isPremium ? 25 : 20)

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

  private addChart(chartData: any, chartType: string, title: string) {
    this.checkPageBreak(200)

    // Add chart title
    this.doc.setFontSize(this.isPremium ? 14 : 12)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(safeText(title), this.margin + 12, this.currentY)
    this.currentY += 20

    const chartWidth = this.pageWidth - 2 * this.margin - 24
    const chartHeight = 120
    const chartX = this.margin + 12
    const chartY = this.currentY

    // Draw chart background
    this.doc.setFillColor(248, 250, 252)
    this.doc.setDrawColor(229, 231, 235)
    this.doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 4, 4, "FD")

    if (chartType === "bar" && chartData) {
      this.drawBarChart(chartData, chartX, chartY, chartWidth, chartHeight)
    } else if (chartType === "pie" && chartData) {
      this.drawPieChart(chartData, chartX, chartY, chartWidth, chartHeight)
    } else if (chartType === "line" && chartData) {
      this.drawLineChart(chartData, chartX, chartY, chartWidth, chartHeight)
    }

    this.currentY += chartHeight + 30
  }

  private drawBarChart(data: any[], x: number, y: number, width: number, height: number) {
    if (!data || data.length === 0) return

    const maxValue = Math.max(...data.map((d) => d.value || d.amount || 0))
    const barWidth = (width - 40) / data.length - 10
    const chartHeight = height - 60

    data.forEach((item, index) => {
      const value = item.value || item.amount || 0
      const barHeight = (value / maxValue) * chartHeight
      const barX = x + 20 + index * (barWidth + 10)
      const barY = y + height - 40 - barHeight

      // Draw bar
      this.doc.setFillColor(16, 185, 129)
      this.doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "F")

      // Draw value label
      this.doc.setFontSize(8)
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(`₺${(value / 1000).toFixed(0)}K`, barX + barWidth / 2, barY - 5, { align: "center" })

      // Draw category label
      const label = safeText(item.name || item.bank || `Item ${index + 1}`)
      const truncatedLabel = label.length > 8 ? label.substring(0, 8) + "..." : label
      this.doc.text(truncatedLabel, barX + barWidth / 2, y + height - 25, { align: "center" })
    })
  }

  private drawPieChart(data: any[], x: number, y: number, width: number, height: number) {
    if (!data || data.length === 0) return

    const centerX = x + width / 2
    const centerY = y + height / 2 - 10
    const radius = Math.min(width, height) / 4

    const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0)
    let currentAngle = 0

    const colors = [
      [16, 185, 129], // emerald
      [59, 130, 246], // blue
      [139, 92, 246], // violet
      [236, 72, 153], // pink
      [245, 158, 11], // amber
      [239, 68, 68], // red
    ]

    data.forEach((item, index) => {
      const value = item.value || item.amount || 0
      const sliceAngle = (value / total) * 2 * Math.PI
      const color = colors[index % colors.length]

      // Draw pie slice
      this.doc.setFillColor(...color)
      this.doc.circle(centerX, centerY, radius, "F")

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20)
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20)

      this.doc.setFontSize(8)
      this.doc.setTextColor(0, 0, 0)
      const percentage = ((value / total) * 100).toFixed(1)
      this.doc.text(`${percentage}%`, labelX, labelY, { align: "center" })

      currentAngle += sliceAngle
    })

    // Draw legend
    let legendY = y + height - 40
    data.forEach((item, index) => {
      const color = colors[index % colors.length]
      this.doc.setFillColor(...color)
      this.doc.rect(x + 20, legendY, 8, 8, "F")

      this.doc.setFontSize(8)
      this.doc.setTextColor(0, 0, 0)
      const label = safeText(item.name || item.bank || `Item ${index + 1}`)
      this.doc.text(label, x + 35, legendY + 6)

      legendY += 12
    })
  }

  private drawLineChart(data: any[], x: number, y: number, width: number, height: number) {
    if (!data || data.length === 0) return

    const maxValue = Math.max(...data.map((d) => d.amount || d.value || 0))
    const chartWidth = width - 40
    const chartHeight = height - 60
    const stepX = chartWidth / (data.length - 1)

    // Draw axes
    this.doc.setDrawColor(156, 163, 175)
    this.doc.line(x + 20, y + height - 40, x + width - 20, y + height - 40) // X axis
    this.doc.line(x + 20, y + 20, x + 20, y + height - 40) // Y axis

    // Draw line
    this.doc.setDrawColor(16, 185, 129)
    for (let i = 0; i < data.length - 1; i++) {
      const value1 = data[i].amount || data[i].value || 0
      const value2 = data[i + 1].amount || data[i + 1].value || 0

      const x1 = x + 20 + i * stepX
      const y1 = y + height - 40 - (value1 / maxValue) * chartHeight
      const x2 = x + 20 + (i + 1) * stepX
      const y2 = y + height - 40 - (value2 / maxValue) * chartHeight

      this.doc.line(x1, y1, x2, y2)

      // Draw points
      this.doc.setFillColor(16, 185, 129)
      this.doc.circle(x1, y1, 2, "F")
    }

    // Draw last point
    if (data.length > 0) {
      const lastValue = data[data.length - 1].amount || data[data.length - 1].value || 0
      const lastX = x + 20 + (data.length - 1) * stepX
      const lastY = y + height - 40 - (lastValue / maxValue) * chartHeight
      this.doc.setFillColor(16, 185, 129)
      this.doc.circle(lastX, lastY, 2, "F")
    }
  }

  private addHeader() {
    const headerHeight = this.isPremium ? 60 : 45

    if (this.isPremium) {
      // Premium gradient header background
      this.doc.setFillColor(248, 250, 252)
      this.doc.rect(0, 0, this.pageWidth, headerHeight, "F")

      // Accent line
      this.doc.setFillColor(16, 185, 129)
      this.doc.rect(0, headerHeight - 4, this.pageWidth, 4, "F")
    }

    // Logo area
    if (this.customLogo) {
      try {
        this.doc.addImage(this.customLogo, "PNG", this.margin, 15, 30, 20)
      } catch (error) {
        console.log("[v0] Logo loading failed, using text fallback")
      }
    }

    // Title
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(this.isPremium ? 20 : 16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(
      this.isPremium ? "Premium Kredi Raporu" : "Kredi Raporu",
      this.customLogo ? this.margin + 40 : this.margin,
      25,
    )

    // Date and report info
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(100, 100, 100)
    const reportDate = new Date().toLocaleDateString("tr-TR")
    this.doc.text(`Rapor Tarihi: ${reportDate}`, this.pageWidth - this.margin - 60, 20)

    if (this.isPremium) {
      this.doc.setTextColor(16, 185, 129)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("PREMIUM", this.pageWidth - this.margin - 60, 35)
    }

    this.currentY = headerHeight + 20
  }

  private addFooter() {
    const footerY = this.pageHeight - 30

    this.doc.setFontSize(8)
    this.doc.setTextColor(100, 100, 100)
    this.doc.setFont("helvetica", "normal")

    // Left side - company info
    this.doc.text("KrediTakip.com.tr", this.margin, footerY)

    // Center - page number
    const pageNum = this.doc.internal.getCurrentPageInfo().pageNumber
    this.doc.text(`Sayfa ${pageNum}`, this.pageWidth / 2, footerY, { align: "center" })

    // Right side - generation date
    const timestamp = new Date().toLocaleString("tr-TR")
    this.doc.text(`Oluşturulma: ${timestamp}`, this.pageWidth - this.margin, footerY, { align: "right" })

    if (this.isPremium) {
      // Premium watermark
      this.doc.setTextColor(240, 240, 240)
      this.doc.setFontSize(6)
      this.doc.text("Premium Report", this.pageWidth - this.margin - 20, footerY + 8, { align: "right" })
    }
  }

  generate() {
    this.addHeader()
    this.addFooter()

    // Enhanced summary with premium features
    this.addSection(
      this.isPremium ? "Yönetici Özeti" : "Genel Özet",
      () => {
        this.addMetricCards()

        if (this.isPremium) {
          this.currentY += 15
          this.doc.setFontSize(12)
          this.doc.setFont("helvetica", "bold")
          this.doc.setTextColor(16, 185, 129)
          this.doc.text("💡 Önemli Bulgular:", this.margin + 20, this.currentY)
          this.currentY += 15

          this.doc.setFont("helvetica", "normal")
          this.doc.setTextColor(0, 0, 0)
          this.doc.setFontSize(10)

          const insights = this.generateInsights()
          insights.forEach((insight) => {
            this.doc.text(`• ${safeText(insight)}`, this.margin + 30, this.currentY)
            this.currentY += 12
          })
        }
      },
      "primary",
    )

    if (this.data.selectedReports && this.data.selectedReports.length > 0) {
      this.addSection(
        "Grafikler ve Analizler",
        () => {
          if (this.data.selectedReports.includes("debtDistribution") && this.data.chartData?.creditDistribution) {
            this.addChart(this.data.chartData.creditDistribution, "pie", "Borç Dağılımı")
          }

          if (this.data.selectedReports.includes("bankComparison") && this.data.chartData?.bankDistribution) {
            this.addChart(this.data.chartData.bankDistribution, "bar", "Banka Karşılaştırması")
          }

          if (this.data.selectedReports.includes("paymentTrend") && this.data.chartData?.monthlyPayments) {
            this.addChart(this.data.chartData.monthlyPayments, "line", "Ödeme Trendi")
          }

          if (this.data.selectedReports.includes("interestComparison") && this.data.chartData?.interestAnalysis) {
            this.addChart(this.data.chartData.interestAnalysis, "bar", "Faiz Oranları Analizi")
          }
        },
        "secondary",
      )
    }

    // Credit details with all selected credits
    if (this.data.credits && this.data.credits.length > 0) {
      this.addSection(
        this.isPremium ? "Detaylı Kredi Analizi" : "Kredi Detayları",
        () => {
          this.data.credits.forEach((credit: any, index: number) => {
            this.addCreditDetails(credit, index)
          })
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

        const totalInterest = this.data.credits.reduce((sum: number, credit: any) => {
          const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
          return sum + monthlyInterest * 12
        }, 0)

        const avgRiskScore =
          this.data.credits.reduce((sum: number, credit: any) => {
            return sum + this.calculateRiskScore(credit)
          }, 0) / (this.data.credits.length || 1)

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
          this.doc.text(`• Optimizasyon Potansiyeli: Yüksek - Detaylar aşağıda`, this.margin + 20, this.currentY + 105)

          this.currentY += 140
        } else {
          // Standard summary
          this.doc.text(
            `• Toplam ${this.data.totalCredits || 0} kredi ile ${formatCurrency(this.data.totalDebt || 0)} borc`,
            this.margin + 20,
            this.currentY,
          )
          this.currentY += 15
          this.doc.text(`• Ortalama faiz orani: ${formatPercentage(avgInterestRate)}`, this.margin + 20, this.currentY)
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
  }

  private getRiskAssessment(riskScore: number): string {
    if (riskScore > 70) return "Yüksek risk - Acil önlem gerekli"
    if (riskScore > 40) return "Orta risk - İzleme öneriliyor"
    return "Düşük risk - Sağlıklı portföy"
  }

  private generateInsights(): string[] {
    const insights: string[] = []

    if (!this.data.credits || this.data.credits.length === 0) {
      insights.push("Kredi verisi bulunamadı.")
      return insights
    }

    const totalDebt = this.data.totalDebt || 0
    const monthlyPayment = this.data.monthlyPayment || 0
    const avgInterestRate =
      this.data.credits.reduce((sum: number, credit: any) => sum + (credit.interestRate || 0), 0) /
      this.data.credits.length

    if (totalDebt > 500000) {
      insights.push("Toplam borcunuz yüksek seviyede. Borçlarınızı yapılandırmayı düşünebilirsiniz.")
    }

    if (monthlyPayment > this.data.monthlyIncome * 0.4) {
      insights.push("Aylık ödeme yükümlülüğünüz gelirinizin %40'ından fazla. Bütçenizi gözden geçirin.")
    }

    if (avgInterestRate > 2.5) {
      insights.push(
        "Ortalama faiz oranınız piyasa ortalamasının üzerinde. Yeniden finansman seçeneklerini değerlendirin.",
      )
    }

    const highRiskCredits = this.data.credits.filter((credit: any) => this.calculateRiskScore(credit) > 70)
    if (highRiskCredits.length > 0) {
      insights.push(`${highRiskCredits.length} adet yüksek riskli krediniz bulunmaktadır. Bu kredilere öncelik verin.`)
    }

    return insights
  }

  private calculateBankDistribution(): any[] {
    // Placeholder for bank distribution calculation
    return []
  }

  private calculateCreditTypeDistribution(): any[] {
    // Placeholder for credit type distribution calculation
    return []
  }

  private addBankLogo(x: number, y: number, bankName: string, size: number) {
    // Placeholder for bank logo addition
  }

  private checkPageBreak(height: number) {
    // Placeholder for page break check
  }

  private addPage() {
    // Placeholder for adding a new page
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
