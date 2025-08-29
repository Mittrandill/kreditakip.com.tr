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

// Banka logo yolları mapping
const BANK_LOGO_PATHS: Record<string, string> = {
  "Yapı Kredi": "/public/bank-icons/yapi-kredi.png",
  "Yapı Kredi Bankası": "/public/bank-icons/yapi-kredi.png",
  Garanti: "/public/bank-icons/garanti.png",
  "Garanti BBVA": "/public/bank-icons/garanti.png",
  Akbank: "/public/bank-icons/akbank.png",
  "İş Bankası": "/public/bank-icons/is-bankasi.png",
  "Türkiye İş Bankası": "/public/bank-icons/is-bankasi.png",
  "Ziraat Bankası": "/public/bank-icons/ziraat.png",
  VakıfBank: "/public/bank-icons/vakifbank.png",
  Halkbank: "/public/bank-icons/halkbank.png",
  DenizBank: "/public/bank-icons/denizbank.png",
  "QNB Finansbank": "/public/bank-icons/qnb.png",
  TEB: "/public/bank-icons/teb.png",
  ING: "/public/bank-icons/ing.png",
}

const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  return String(text)
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
    this.margin = 20 // Reduced margin for better space utilization
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
    // Use solid color instead of gradient for better compatibility
    this.doc.setFillColor(...startColor)
    this.doc.rect(x, y, width, height, "F")
  }

  private async addModernHeader() {
    this.addGradientRect(0, 0, this.pageWidth, 60, COLORS.primary, COLORS.accent)

    // Logo placeholder - simplified
    this.doc.setFillColor(...COLORS.white)
    this.doc.rect(this.margin, 15, 25, 25, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", this.margin + 12.5, 30, { align: "center" })

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(18)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI PORTFOY RAPORU", this.margin + 35, 25)

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Detaylı Finansal Analiz", this.margin + 35, 40)

    const rightX = this.pageWidth - this.margin - 80
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.white)
    this.doc.text(format(new Date(), "dd MMMM yyyy", { locale: tr }), rightX, 25)

    if (this.data.userData?.name) {
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(this.data.userData.name), rightX, 40)
    }

    this.currentY = 80 // Fixed starting Y position
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
    this.checkPageBreak(60)

    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 4 // Fixed card width calculation
    const cardHeight = 50 // Reduced height to prevent overlaps

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 5) // Reduced spacing between cards
      const color = COLORS[metric.color || "primary"]

      // Kart arka planı
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(230, 230, 230)
      this.doc.rect(x, this.currentY, cardWidth, cardHeight, "FD")

      // Üst renkli çizgi
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 2, "F")

      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 5, this.currentY + 12)

      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(safeText(metric.value), x + 5, this.currentY + 28)

      if (metric.subtitle) {
        this.doc.setFontSize(6)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(safeText(metric.subtitle), x + 5, this.currentY + 40)
      }
    })

    this.currentY += cardHeight + 20 // Fixed Y position increment
  }

  private addModernSection(title: string, icon = "", color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(30)

    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, "F")

    this.doc.setFillColor(...COLORS[color])
    this.doc.rect(this.margin, this.currentY, 3, 25, "F")

    if (icon) {
      this.doc.setTextColor(...COLORS[color])
      this.doc.setFontSize(14)
      this.doc.text(icon, this.margin + 10, this.currentY + 17)
    }

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title), this.margin + (icon ? 25 : 10), this.currentY + 17)

    this.currentY += 35 // Fixed Y increment
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
    const rowHeight = 25 // Fixed row height
    const headerHeight = 30 // Fixed header height

    this.checkPageBreak(headerHeight + Math.min(rows.length, 10) * rowHeight)

    this.doc.setFillColor(...COLORS[opts.headerColor])
    this.doc.rect(this.margin, this.currentY, totalWidth, headerHeight, "F")

    // Header text
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      this.doc.text(safeText(header).toUpperCase(), xPos + 5, this.currentY + 20)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    rows.forEach((row, rowIndex) => {
      // Check for page break every 5 rows
      if (rowIndex > 0 && rowIndex % 5 === 0) {
        this.checkPageBreak(rowHeight * 5)
      }

      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      // Border line
      this.doc.setDrawColor(230, 230, 230)
      this.doc.setLineWidth(0.3)
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

      // Row content
      xPos = this.margin
      row.forEach((cell, colIndex) => {
        if (cell.includes("TL")) {
          this.doc.setTextColor(...COLORS.primary)
          this.doc.setFont("helvetica", "bold")
        } else {
          this.doc.setTextColor(...COLORS.dark)
          this.doc.setFont("helvetica", "normal")
        }

        this.doc.setFontSize(8)
        const maxWidth = colWidths[colIndex] - 10
        const lines = this.doc.splitTextToSize(safeText(cell), maxWidth)
        this.doc.text(lines[0] || "", xPos + 5, this.currentY + 15)
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 15 // Fixed spacing after table
  }

  private async addCreditCard(credit: any, index: number) {
    this.checkPageBreak(120)

    const cardHeight = 100 // Reduced card height

    // Card container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(220, 220, 220)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, cardHeight, "FD")

    // Header
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      25,
      COLORS.primary,
      COLORS.secondary,
    )

    // Bank initials (simplified)
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(this.margin + 15, this.currentY + 12.5, 8, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    const bankName = credit.bankName || "Bilinmeyen Banka"
    const initials = bankName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    this.doc.text(initials, this.margin + 15, this.currentY + 15, { align: "center" })

    // Bank name and credit type
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(
      `${safeText(bankName)} - ${safeText(credit.creditType || "Kredi")}`,
      this.margin + 30,
      this.currentY + 16,
    )

    // Status badge
    const statusX = this.pageWidth - this.margin - 50
    if (credit.status === "active") {
      this.doc.setFillColor(236, 253, 245)
      this.doc.rect(statusX, this.currentY + 5, 40, 15, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(7)
      this.doc.text("AKTIF", statusX + 20, this.currentY + 15, { align: "center" })
    }

    const contentY = this.currentY + 35
    const leftX = this.margin + 10
    const centerX = this.margin + (this.pageWidth - 2 * this.margin) / 3
    const rightX = this.margin + (2 * (this.pageWidth - 2 * this.margin)) / 3

    // Progress bar
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const progressPercentage = credit.amount ? (paidAmount / credit.amount) * 100 : 0

    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.rect(leftX, contentY, this.pageWidth - 2 * this.margin - 20, 5, "F")
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(leftX, contentY, ((this.pageWidth - 2 * this.margin - 20) * progressPercentage) / 100, 5, "F")

    // Content in three columns
    const textY = contentY + 20

    // Left column
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(7)
    this.doc.text("KREDI TUTARI", leftX, textY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.amount || 0), leftX, textY + 12)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KALAN BORÇ", leftX, textY + 25)
    this.doc.setTextColor(...COLORS.danger)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.remainingDebt || 0), leftX, textY + 37)

    // Center column
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK ÖDEME", centerX, textY)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(credit.monthlyPayment || 0), centerX, textY + 12)

    // Right column
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("FAİZ ORANI", rightX, textY)
    this.doc.setTextColor(...COLORS.info)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, rightX, textY + 12)

    this.currentY += cardHeight + 15 // Fixed Y increment
  }

  private addSummarySection() {
    this.checkPageBreak(80)

    this.doc.setFillColor(248, 250, 252)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 70, "F")

    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(16)
    this.doc.text("📊", this.margin + 15, this.currentY + 20)

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Özet Bilgiler", this.margin + 35, this.currentY + 20)

    const summaryY = this.currentY + 35
    const leftCol = this.margin + 20
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

    // Left column
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Toplam Kredi Sayısı:", leftCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${this.data.totalCredits || 0} adet`, leftCol + 70, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Ortalama Faiz Oranı:", leftCol, summaryY + 15)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${avgRate.toFixed(2)}`, leftCol + 70, summaryY + 15)

    // Right column
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Yıllık Toplam Faiz:", rightCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(totalInterest), rightCol + 60, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("• Aylık Ödeme Yükü:", rightCol, summaryY + 15)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(formatCurrency(this.data.monthlyPayment || 0), rightCol + 60, summaryY + 15)

    this.currentY += 90
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      this.addGradientRect(0, this.pageHeight - 25, this.pageWidth, 25, COLORS.primary, COLORS.accent)

      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 10)

      this.doc.setFont("helvetica", "normal")
      this.doc.text("Finansal özgürlüğünüze giden yol", this.pageWidth / 2, this.pageHeight - 10, { align: "center" })

      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 10, { align: "right" })
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 50) {
      // Increased footer margin
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = this.margin + 15 // Fixed starting position for new pages
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

  private calculateCreditTypeDistribution() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const typeMap = new Map()
    let totalAmount = 0

    this.data.credits.forEach((credit: any) => {
      const creditType = credit.creditType || "Diğer"
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
          icon: "📋",
        },
        {
          title: "Toplam Borç",
          value: formatCurrency(this.data.totalDebt || 0),
          subtitle: "Kalan",
          color: "danger" as keyof typeof COLORS,
          icon: "💰",
        },
        {
          title: "Aylık Ödeme",
          value: formatCurrency(this.data.monthlyPayment || 0),
          subtitle: "Taksit",
          color: "warning" as keyof typeof COLORS,
          icon: "📅",
        },
        {
          title: "Toplam Kredi",
          value: formatCurrency(this.data.totalPayment || 0),
          subtitle: "Başlangıç",
          color: "success" as keyof typeof COLORS,
          icon: "✓",
        },
      ]

      this.addModernMetricCards(metrics)

      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Kredi Detayları", "💳", "primary")

        for (const [index, credit] of this.data.credits.entries()) {
          await this.addCreditCard(credit, index)
        }
      }

      this.addModernSection("Banka Dağılımı", "🏦", "info")
      const bankDist = this.calculateBankDistribution()
      if (bankDist.length > 0) {
        const headers = ["Banka", "Adet", "Toplam Borç", "Oran"]
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

      this.addModernSection("Kredi Türü Dağılımı", "📊", "secondary")
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

      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Faiz Analizi", "💸", "warning")
        const headers = ["Banka", "Kredi Türü", "Faiz Oranı", "Aylık Faiz", "Yıllık Faiz"]
        const rows = this.data.credits.map((credit: any) => {
          const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
          const yearlyInterest = monthlyInterest * 12
          return [
            credit.bankName || "Bilinmeyen",
            credit.creditType || "Diğer",
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

      this.addModernSection("Rapor Özeti", "📊", "success")
      this.addSummarySection()

      this.addModernFooter()
    } catch (error) {
      console.error("PDF oluşturma hatası:", error)
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

    console.log("PDF başarıyla oluşturuldu:", filename)
  } catch (error) {
    console.error("PDF oluşturma hatası:", error)
    throw error
  }
}
