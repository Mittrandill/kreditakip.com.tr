import { jsPDF } from "jspdf"
import { format } from "date-fns"

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
    const steps = 20
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
    this.addGradientRect(0, 0, this.pageWidth, 70, [16, 185, 129], [13, 148, 136])

    this.doc.setFillColor(255, 255, 255)
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
    this.doc.circle(this.pageWidth - 80, 35, 100, "F")
    this.doc.circle(this.pageWidth - 40, 20, 60, "F")
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    this.doc.setFillColor(255, 255, 255)
    this.doc.roundedRect(this.margin, 20, 28, 28, 3, 3, "F")
    this.doc.setTextColor(16, 185, 129)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", this.margin + 14, 37, { align: "center" })

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(18)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI PORTFOY RAPORU", this.margin + 40, 32)

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Detayli Finansal Analiz", this.margin + 40, 45)

    const rightX = this.pageWidth - this.margin - 80
    this.doc.setFontSize(10)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(format(new Date(), "dd MMMM yyyy"), rightX, 30)

    if (this.data.userData?.name) {
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(this.data.userData.name), rightX, 45)
    }

    this.currentY = 90
  }

  private addModernMetricCards(
    metrics: Array<{
      title: string
      value: string
      subtitle?: string
      color?: string
      icon?: string
    }>,
  ) {
    this.checkPageBreak(80)

    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 65

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10)

      this.doc.setFillColor(255, 255, 255)
      this.doc.setDrawColor(226, 232, 240)
      this.doc.setLineWidth(0.5)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 6, 6, "FD")

      let accentColor: [number, number, number] = [16, 185, 129]
      if (metric.color === "danger") accentColor = [239, 68, 68]
      else if (metric.color === "warning") accentColor = [251, 146, 60]
      else if (metric.color === "success") accentColor = [34, 197, 94]

      this.doc.setFillColor(...accentColor)
      this.doc.roundedRect(x, this.currentY, cardWidth, 2, 6, 6, "F")

      if (metric.icon) {
        this.doc.setTextColor(...accentColor)
        this.doc.setGState(this.doc.GState({ opacity: 0.2 }))
        this.doc.setFontSize(18)
        this.doc.text(metric.icon, x + cardWidth - 20, this.currentY + 25, { align: "center" })
        this.doc.setGState(this.doc.GState({ opacity: 1 }))
      }

      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(100, 116, 139)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 8, this.currentY + 18)

      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(30, 41, 59)
      this.doc.text(safeText(metric.value), x + 8, this.currentY + 35)

      if (metric.subtitle) {
        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(148, 163, 184)
        this.doc.text(safeText(metric.subtitle), x + 8, this.currentY + 50)
      }
    })

    this.currentY += cardHeight + 25
  }

  private addModernSection(title: string, icon = "") {
    this.checkPageBreak(40)

    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 30, 6, 6, "F")

    this.doc.setFillColor(16, 185, 129)
    this.doc.roundedRect(this.margin, this.currentY, 3, 30, 2, 2, "F")

    if (icon) {
      this.doc.setTextColor(16, 185, 129)
      this.doc.setFontSize(16)
      this.doc.text(icon, this.margin + 15, this.currentY + 20)
    }

    this.doc.setTextColor(30, 41, 59)
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + (icon ? 35 : 15), this.currentY + 20)

    this.currentY += 40
  }

  private addCreditCard(credit: any, index: number) {
    this.checkPageBreak(160)

    this.doc.setFillColor(255, 255, 255)
    this.doc.setDrawColor(226, 232, 240)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 140, 8, 8, "FD")

    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      30,
      [16, 185, 129],
      [20, 184, 166],
    )

    this.doc.setFillColor(255, 255, 255)
    this.doc.circle(this.margin + 20, this.currentY + 15, 10, "F")
    this.doc.setTextColor(16, 185, 129)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    const initials =
      credit.bankName
        ?.split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2) || "BK"
    this.doc.text(initials, this.margin + 20, this.currentY + 18, { align: "center" })

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${safeText(credit.bankName)} - ${safeText(credit.creditType)}`, this.margin + 35, this.currentY + 18)

    const statusX = this.pageWidth - this.margin - 50
    if (credit.status === "active") {
      this.doc.setFillColor(255, 255, 255)
      this.doc.setGState(this.doc.GState({ opacity: 0.9 }))
      this.doc.roundedRect(statusX, this.currentY + 8, 40, 14, 7, 7, "F")
      this.doc.setGState(this.doc.GState({ opacity: 1 }))
      this.doc.setTextColor(16, 185, 129)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("AKTIF", statusX + 20, this.currentY + 17, { align: "center" })
    }

    this.currentY += 40

    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const progressPercentage = credit.amount ? (paidAmount / credit.amount) * 100 : 0

    this.doc.setTextColor(100, 116, 139)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`%${progressPercentage.toFixed(1)} Odendi`, this.margin + 20, this.currentY - 5)

    this.doc.setFillColor(241, 245, 249)
    this.doc.roundedRect(this.margin + 20, this.currentY, this.pageWidth - 2 * this.margin - 40, 6, 3, 3, "F")
    this.doc.setFillColor(16, 185, 129)
    this.doc.roundedRect(
      this.margin + 20,
      this.currentY,
      ((this.pageWidth - 2 * this.margin - 40) * progressPercentage) / 100,
      6,
      3,
      3,
      "F",
    )

    this.currentY += 20

    const leftX = this.margin + 20
    const centerX = this.margin + (this.pageWidth - 2 * this.margin) / 3
    const rightX = this.margin + (2 * (this.pageWidth - 2 * this.margin)) / 3

    // Left column
    this.doc.setTextColor(148, 163, 184)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI TUTARI", leftX, this.currentY)
    this.doc.setTextColor(30, 41, 59)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.amount || 0), leftX, this.currentY + 15)

    this.doc.setTextColor(148, 163, 184)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KALAN BORC", leftX, this.currentY + 35)
    this.doc.setTextColor(239, 68, 68)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.remainingDebt || 0), leftX, this.currentY + 50)

    // Center column
    this.doc.setTextColor(148, 163, 184)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("AYLIK ODEME", centerX, this.currentY)
    this.doc.setTextColor(251, 146, 60)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.monthlyPayment || 0), centerX, this.currentY + 15)

    if (credit.totalInstallments) {
      this.doc.setTextColor(148, 163, 184)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("TAKSIT", centerX, this.currentY + 35)
      this.doc.setTextColor(30, 41, 59)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      const paidInstallments = credit.totalInstallments - (credit.remainingInstallments || 0)
      this.doc.text(`${paidInstallments} / ${credit.totalInstallments}`, centerX, this.currentY + 50)
    }

    // Right column
    this.doc.setTextColor(148, 163, 184)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("FAIZ ORANI", rightX, this.currentY)
    this.doc.setTextColor(59, 130, 246)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, rightX, this.currentY + 15)

    const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
    this.doc.setTextColor(148, 163, 184)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("AYLIK FAIZ", rightX, this.currentY + 35)
    this.doc.setTextColor(30, 41, 59)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(monthlyInterest), rightX, this.currentY + 50)

    this.currentY += 80
  }

  private addModernTable(headers: string[], rows: string[][]) {
    const totalWidth = this.pageWidth - 2 * this.margin
    const colWidths = [120, 40, 100, 60]
    const rowHeight = 25
    const headerHeight = 30

    this.checkPageBreak(headerHeight + rows.length * rowHeight)

    this.addGradientRect(this.margin, this.currentY, totalWidth, headerHeight, [16, 185, 129], [13, 148, 136])

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      this.doc.text(safeText(header).toUpperCase(), xPos + 10, this.currentY + 20)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      this.doc.setDrawColor(226, 232, 240)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

      xPos = this.margin
      row.forEach((cell, colIndex) => {
        if (colIndex === headers.length - 1 && cell.includes("TL")) {
          this.doc.setTextColor(16, 185, 129)
          this.doc.setFont("helvetica", "bold")
        } else {
          this.doc.setTextColor(30, 41, 59)
          this.doc.setFont("helvetica", "normal")
        }

        this.doc.setFontSize(9)
        this.doc.text(safeText(cell), xPos + 10, this.currentY + 16)
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 20
  }

  private addSummarySection() {
    this.checkPageBreak(100)

    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 80, 8, 8, "F")

    this.doc.setTextColor(16, 185, 129)
    this.doc.setFontSize(18)
    this.doc.text("📊", this.margin + 20, this.currentY + 25)

    this.doc.setTextColor(30, 41, 59)
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Ozet Bilgiler", this.margin + 45, this.currentY + 25)

    const summaryY = this.currentY + 40
    const leftCol = this.margin + 25
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

    this.doc.setTextColor(100, 116, 139)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Toplam Kredi Sayisi:", leftCol, summaryY)
    this.doc.setTextColor(30, 41, 59)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${this.data.totalCredits || 0} adet`, leftCol + 80, summaryY)

    this.doc.setTextColor(100, 116, 139)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Ortalama Faiz Orani:", leftCol, summaryY + 15)
    this.doc.setTextColor(30, 41, 59)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${avgRate.toFixed(2)}`, leftCol + 80, summaryY + 15)

    this.doc.setTextColor(100, 116, 139)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Yillik Toplam Faiz:", rightCol, summaryY)
    this.doc.setTextColor(30, 41, 59)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${formatCurrency(totalInterest)}`, rightCol + 70, summaryY)

    this.doc.setTextColor(100, 116, 139)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Aylik Odeme Yuku:", rightCol, summaryY + 15)
    this.doc.setTextColor(30, 41, 59)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${formatCurrency(this.data.monthlyPayment || 0)}`, rightCol + 70, summaryY + 15)

    this.currentY += 100
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      this.addGradientRect(0, this.pageHeight - 25, this.pageWidth, 25, [16, 185, 129], [13, 148, 136])

      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 10)

      this.doc.setFont("helvetica", "normal")
      this.doc.text("Finansal ozgurlugunuze giden yol", this.pageWidth / 2, this.pageHeight - 10, { align: "center" })

      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 10, { align: "right" })
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
    this.currentY = this.margin + 20
  }

  public async generate() {
    try {
      this.addModernHeader()

      const metrics = [
        {
          title: "Toplam Kredi",
          value: this.data.totalCredits?.toString() || "0",
          subtitle: `${this.data.activeCredits || 0} aktif, ${(this.data.totalCredits || 0) - (this.data.activeCredits || 0)} kapali`,
          color: "primary",
          icon: "📋",
        },
        {
          title: "Toplam Borc",
          value: formatCurrency(this.data.totalDebt || 0),
          subtitle: "Kalan",
          color: "danger",
          icon: "💰",
        },
        {
          title: "Aylik Odeme",
          value: formatCurrency(this.data.monthlyPayment || 0),
          subtitle: "Taksit",
          color: "warning",
          icon: "📅",
        },
        {
          title: "Toplam Kredi",
          value: formatCurrency(this.data.totalPayment || 0),
          subtitle: "Baslangic",
          color: "success",
          icon: "✓",
        },
      ]

      this.addModernMetricCards(metrics)

      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Kredi Detaylari", "💳")
        this.data.credits.forEach((credit: any, index: number) => {
          this.addCreditCard(credit, index)
          this.currentY += 15
        })
      }

      this.addModernSection("Banka Dagilimi", "🏦")
      const bankDist = this.calculateBankDistribution()
      if (bankDist.length > 0) {
        const headers = ["Banka", "Adet", "Toplam Borc", "Oran"]
        const rows = bankDist.map((b) => [
          b.name,
          b.count.toString(),
          formatCurrency(b.amount),
          `%${b.percentage.toFixed(1)}`,
        ])
        this.addModernTable(headers, rows)
      }

      this.addModernSection("Ozet Bilgiler", "📊")
      this.addSummarySection()

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
