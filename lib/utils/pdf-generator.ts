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

const BANK_LOGO_PATHS: Record<string, string> = {
  // Yapı Kredi variations
  "Yapı Kredi": "/bank-icons/yapi-kredi.png",
  "Yapı Kredi Bankası": "/bank-icons/yapi-kredi.png",
  "Yapı ve Kredi Bankası A.Ş.": "/bank-icons/yapi-kredi.png",
  "Yapı ve Kredi": "/bank-icons/yapi-kredi.png",
  YapıKredi: "/bank-icons/yapi-kredi.png",

  // Garanti variations
  Garanti: "/bank-icons/garanti.png",
  "Garanti BBVA": "/bank-icons/garanti.png",
  "Türkiye Garanti Bankası": "/bank-icons/garanti.png",
  "Türkiye Garanti Bankası A.Ş.": "/bank-icons/garanti.png",
  "Garanti Bankası": "/bank-icons/garanti.png",

  // Akbank variations
  Akbank: "/bank-icons/akbank.png",
  "Akbank T.A.Ş.": "/bank-icons/akbank.png",

  // İş Bankası variations
  "İş Bankası": "/bank-icons/is-bankasi.png",
  "Türkiye İş Bankası": "/bank-icons/is-bankasi.png",
  "Türkiye İş Bankası A.Ş.": "/bank-icons/is-bankasi.png",
  İşbank: "/bank-icons/is-bankasi.png",

  // Ziraat Bankası variations
  "Ziraat Bankası": "/bank-icons/ziraat.png",
  "T.C. Ziraat Bankası A.Ş.": "/bank-icons/ziraat.png",
  "TC Ziraat Bankası": "/bank-icons/ziraat.png",
  Ziraat: "/bank-icons/ziraat.png",

  // VakıfBank variations
  VakıfBank: "/bank-icons/vakifbank.png",
  "Türkiye Vakıflar Bankası": "/bank-icons/vakifbank.png",
  "Türkiye Vakıflar Bankası T.A.O.": "/bank-icons/vakifbank.png",
  "Vakıflar Bankası": "/bank-icons/vakifbank.png",
  "Vakıf Bankası": "/bank-icons/vakifbank.png",

  // Halkbank variations
  Halkbank: "/bank-icons/halkbank.png",
  "Türkiye Halk Bankası A.Ş.": "/bank-icons/halkbank.png",
  "Halk Bankası": "/bank-icons/halkbank.png",
  "T. Halk Bankası A.Ş.": "/bank-icons/halkbank.png",

  // DenizBank variations
  DenizBank: "/bank-icons/denizbank.png",
  "DenizBank A.Ş.": "/bank-icons/denizbank.png",
  Denizbank: "/bank-icons/denizbank.png",

  // Additional banks...
  "Enpara Bank": "/bank-icons/enpara.png",
  Fibabanka: "/bank-icons/fibabanka.png",
  "QNB Finansbank": "/bank-icons/qnb.png",
  TEB: "/bank-icons/teb.png",
  ING: "/bank-icons/ing.png",
}

const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  return String(text).trim()
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
  private loadedImages: Map<string, string> = new Map()

  constructor(doc: jsPDF, data: any) {
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
    // Use fewer steps for better performance
    const steps = 10
    const stepHeight = height / steps

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1)
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio)
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio)
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio)

      this.doc.setFillColor(r, g, b)
      this.doc.rect(x, y + i * stepHeight, width, stepHeight + 1, "F")
    }
  }

  private async loadBankLogo(bankName: string): Promise<string | null> {
    try {
      const logoPath = BANK_LOGO_PATHS[bankName]
      if (!logoPath) return null

      if (this.loadedImages.has(logoPath)) {
        return this.loadedImages.get(logoPath)!
      }

      // In a real implementation, you would load the image from the path
      // For now, we'll return null and fall back to initials
      return null
    } catch (error) {
      console.log(`[v0] Failed to load logo for ${bankName}:`, error)
      return null
    }
  }

  private addModernHeader() {
    // Gradient arka plan
    this.addGradientRect(0, 0, this.pageWidth, 80, COLORS.primary, COLORS.accent)

    this.doc.setFillColor(255, 255, 255)
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
    this.doc.circle(this.pageWidth - 40, 40, 30, "F")
    this.doc.circle(this.pageWidth - 80, 25, 20, "F")
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Logo placeholder
    this.doc.setFillColor(...COLORS.white)
    this.doc.roundedRect(this.margin, 25, 30, 30, 3, 3, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KT", this.margin + 15, 43, { align: "center" })

    // Başlık
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText("KREDİ PORTFÖY RAPORU"), this.margin + 45, 40)

    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("Detaylı Finansal Analiz"), this.margin + 45, 55)

    // Sağ taraf bilgileri
    const rightX = this.pageWidth - this.margin - 100
    this.doc.setFontSize(10)
    this.doc.setTextColor(...COLORS.white)
    const dateStr = format(new Date(), "dd MMMM yyyy", { locale: tr })
    this.doc.text(safeText(dateStr), rightX, 35)

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

    const availableWidth = this.pageWidth - 2 * this.margin
    const cardWidth = (availableWidth - 30) / 4 // 3 gaps of 10pt each
    const cardHeight = 70

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10)
      const color = COLORS[metric.color || "primary"]

      // Kart arka planı
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(230, 230, 230)
      this.doc.setLineWidth(0.5)
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 4, 4, "FD")

      // Üst renkli çizgi
      this.doc.setFillColor(...color)
      this.doc.rect(x, this.currentY, cardWidth, 3, "F")

      // İkon arka planı
      if (metric.icon) {
        this.doc.setFillColor(...color)
        this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
        this.doc.circle(x + cardWidth - 20, this.currentY + 25, 15, "F")
        this.doc.setGState(this.doc.GState({ opacity: 1 }))

        this.doc.setTextColor(...color)
        this.doc.setFontSize(16)
        this.doc.text(metric.icon, x + cardWidth - 20, this.currentY + 30, { align: "center" })
      }

      // Başlık
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text(safeText(metric.title).toUpperCase(), x + 10, this.currentY + 20)

      // Değer
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.dark)
      this.doc.text(safeText(metric.value), x + 10, this.currentY + 40)

      // Alt başlık
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

    // Bölüm başlığı
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 5, 5, "F")

    // Renkli vurgu çizgisi
    this.doc.setFillColor(...COLORS[color])
    this.doc.roundedRect(this.margin, this.currentY, 4, 35, 2, 2, "F")

    // İkon
    if (icon) {
      this.doc.setTextColor(...COLORS[color])
      this.doc.setFontSize(18)
      this.doc.text(icon, this.margin + 15, this.currentY + 22)
    }

    // Başlık
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
    const actualTotal = colWidths.reduce((sum, width) => sum + width, 0)

    // Adjust if total doesn't match
    if (actualTotal !== totalWidth) {
      const ratio = totalWidth / actualTotal
      colWidths.forEach((width, i) => {
        colWidths[i] = width * ratio
      })
    }

    const rowHeight = 35
    const headerHeight = 40

    this.checkPageBreak(headerHeight + Math.min(rows.length, 5) * rowHeight)

    // Tablo başlığı gradient
    this.addGradientRect(this.margin, this.currentY, totalWidth, headerHeight, COLORS[opts.headerColor], COLORS.accent)

    // Başlık metinleri
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")

    let xPos = this.margin
    headers.forEach((header, i) => {
      this.doc.text(safeText(header).toUpperCase(), xPos + 15, this.currentY + 25)
      xPos += colWidths[i]
    })

    this.currentY += headerHeight

    // Tablo satırları
    rows.forEach((row, rowIndex) => {
      // Check page break for each row
      this.checkPageBreak(rowHeight + 20)

      // Alternatif satır renkleri
      if (opts.alternateRows && rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252)
        this.doc.rect(this.margin, this.currentY, totalWidth, rowHeight, "F")
      }

      // Alt çizgi
      this.doc.setDrawColor(230, 230, 230)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

      // Satır içeriği
      xPos = this.margin
      row.forEach((cell, colIndex) => {
        // Tutar sütunu için özel renklendirme
        if (cell.includes("TL")) {
          this.doc.setTextColor(...COLORS.primary)
          this.doc.setFont("helvetica", "bold")
        } else {
          this.doc.setTextColor(...COLORS.dark)
          this.doc.setFont("helvetica", "normal")
        }

        this.doc.setFontSize(10)
        const maxWidth = colWidths[colIndex] - 20
        const text = safeText(cell)
        this.doc.text(text, xPos + 10, this.currentY + 22, { maxWidth })
        xPos += colWidths[colIndex]
      })

      this.currentY += rowHeight
    })

    this.currentY += 20
  }

  private async addCreditCard(credit: any, index: number) {
    this.checkPageBreak(180)

    // Kart konteyneri
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(220, 220, 220)
    this.doc.setLineWidth(1)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 160, 8, 8, "FD")

    // Gradient başlık
    this.addGradientRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      35,
      COLORS.primary,
      COLORS.secondary,
    )

    const bankName = credit.bankName || "Bilinmeyen Banka"
    const logoData = await this.loadBankLogo(bankName)

    if (logoData) {
      try {
        this.doc.addImage(logoData, "PNG", this.margin + 15, this.currentY + 8, 20, 20)
      } catch (error) {
        console.log(`[v0] Failed to add bank logo, using initials:`, error)
        this.addBankInitials(bankName, this.margin + 25, this.currentY + 18)
      }
    } else {
      this.addBankInitials(bankName, this.margin + 25, this.currentY + 18)
    }

    // Banka adı ve kredi türü
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(`${bankName} - ${credit.creditType || "Kredi"}`), this.margin + 45, this.currentY + 22)

    // Durum rozeti
    const statusX = this.pageWidth - this.margin - 60
    if (credit.status === "active") {
      this.doc.setFillColor(236, 253, 245)
      this.doc.roundedRect(statusX, this.currentY + 10, 50, 18, 9, 9, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(9)
      this.doc.text("AKTİF", statusX + 25, this.currentY + 21, { align: "center" })
    } else {
      this.doc.setFillColor(243, 244, 246)
      this.doc.roundedRect(statusX, this.currentY + 10, 50, 18, 9, 9, "F")
      this.doc.setTextColor(...COLORS.gray)
      this.doc.text("KAPALI", statusX + 25, this.currentY + 21, { align: "center" })
    }

    this.currentY += 45

    // İçerik alanı
    const contentY = this.currentY
    const leftX = this.margin + 20
    const centerX = this.margin + (this.pageWidth - 2 * this.margin) / 3
    const rightX = this.margin + (2 * (this.pageWidth - 2 * this.margin)) / 3

    // Hesaplamalar
    const paidAmount = (credit.amount || 0) - (credit.remainingDebt || 0)
    const progressPercentage = credit.amount ? (paidAmount / credit.amount) * 100 : 0

    const progressBarWidth = this.pageWidth - 2 * this.margin - 40
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(leftX, contentY, progressBarWidth, 8, 4, 4, "F")

    if (progressPercentage > 0) {
      this.doc.setFillColor(...COLORS.primary)
      const fillWidth = Math.max(0, Math.min((progressBarWidth * progressPercentage) / 100, progressBarWidth))
      if (fillWidth > 0) {
        this.doc.roundedRect(leftX, contentY, fillWidth, 8, 4, 4, "F")
      }
    }

    // İlerleme metni
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(9)
    this.doc.text(safeText(`%${progressPercentage.toFixed(1)} Ödendi`), leftX, contentY - 5)

    this.currentY = contentY + 20

    // Sol sütun - tutarlar
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.text("KREDİ TUTARI", leftX, this.currentY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatCurrency(credit.amount || 0)), leftX, this.currentY + 15)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("KALAN BORÇ", leftX, this.currentY + 35)
    this.doc.setTextColor(...COLORS.danger)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatCurrency(credit.remainingDebt || 0)), leftX, this.currentY + 50)

    // Orta sütun - taksitler
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK ÖDEME", centerX, this.currentY)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatCurrency(credit.monthlyPayment || 0)), centerX, this.currentY + 15)

    if (credit.totalInstallments) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("TAKSİT", centerX, this.currentY + 35)
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      const paidInstallments = credit.totalInstallments - (credit.remainingInstallments || 0)
      this.doc.text(`${paidInstallments} / ${credit.totalInstallments}`, centerX, this.currentY + 50)
    }

    // Sağ sütun - faiz ve tarihler
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("FAİZ ORANI", rightX, this.currentY)
    this.doc.setTextColor(...COLORS.info)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${(credit.interestRate || 0).toFixed(2)}`, rightX, this.currentY + 15)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("AYLIK FAİZ", rightX, this.currentY + 35)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    const monthlyInterestValue = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
    this.doc.text(safeText(formatCurrency(monthlyInterestValue)), rightX, this.currentY + 50)

    this.currentY = contentY + 115
  }

  private addBankInitials(bankName: string, x: number, y: number) {
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(x, y, 12, "F")
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    const initials = bankName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    this.doc.text(initials, x, y + 4, { align: "center" })
  }

  private addSummarySection() {
    this.checkPageBreak(120)

    // Özet kutusu
    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 100, 8, 8, "F")

    // İkon ve başlık
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(20)
    this.doc.text("📊", this.margin + 20, this.currentY + 25)

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText("Özet Bilgiler"), this.margin + 45, this.currentY + 25)

    // Özet bilgiler
    const summaryY = this.currentY + 45
    const leftCol = this.margin + 30
    const rightCol = this.pageWidth / 2

    const totalInterest =
      this.data.credits?.reduce((sum: number, credit: any) => {
        const monthlyInterest = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 1200
        return sum + monthlyInterest * 12
      }, 0) || 0

    const avgRate =
      this.data.credits?.length > 0
        ? this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length
        : 0

    // Sol sütun
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Toplam Kredi Sayısı:"), leftCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` ${this.data.totalCredits || 0} adet`, leftCol + 80, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Ortalama Faiz Oranı:"), leftCol, summaryY + 20)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(` %${avgRate.toFixed(2)}`, leftCol + 80, summaryY + 20)

    // Sağ sütun
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Yıllık Toplam Faiz:"), rightCol, summaryY)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(` ${formatCurrency(totalInterest)}`), rightCol + 70, summaryY)

    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("• Aylık Ödeme Yükü:"), rightCol, summaryY + 20)
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(` ${formatCurrency(this.data.monthlyPayment || 0)}`), rightCol + 70, summaryY + 20)

    this.currentY += 120
  }

  private addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      // Footer gradient
      this.addGradientRect(0, this.pageHeight - 30, this.pageWidth, 30, COLORS.primary, COLORS.accent)

      // Sol - marka
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 12)

      // Orta - slogan
      this.doc.setFont("helvetica", "normal")
      this.doc.text(safeText("Finansal özgürlüğünüze giden yol"), this.pageWidth / 2, this.pageHeight - 12, {
        align: "center",
      })

      // Sağ - sayfa numarası
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 12, { align: "right" })
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 50) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = this.margin + 20
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
      console.log("[v0] Starting PDF generation...")

      // Modern header
      this.addModernHeader()

      // Özet metrikleri
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
          value: safeText(formatCurrency(this.data.totalDebt || 0)),
          subtitle: "Kalan",
          color: "danger" as keyof typeof COLORS,
          icon: "💰",
        },
        {
          title: "Aylık Ödeme",
          value: safeText(formatCurrency(this.data.monthlyPayment || 0)),
          subtitle: "Taksit",
          color: "warning" as keyof typeof COLORS,
          icon: "📅",
        },
        {
          title: "Toplam Kredi",
          value: safeText(formatCurrency(this.data.totalPayment || 0)),
          subtitle: "Başlangıç",
          color: "success" as keyof typeof COLORS,
          icon: "✓",
        },
      ]

      this.addModernMetricCards(metrics)

      // Kredi detayları
      if (this.data.credits && this.data.credits.length > 0) {
        this.addModernSection("Kredi Detayları", "💳", "primary")

        for (const [index, credit] of this.data.credits.entries()) {
          await this.addCreditCard(credit, index)
          this.currentY += 20
        }
      }

      // Banka dağılımı
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
          columnWidths: [150, 60, 120, 80],
        })
      }

      // Kredi türü dağılımı
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
          columnWidths: [150, 60, 120, 80],
        })
      }

      // Faiz analizi
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
          columnWidths: [100, 90, 70, 85, 85],
        })
      }

      // Özet bölümü
      this.addModernSection("Rapor Özeti", "📊", "success")
      this.addSummarySection()

      // Footer ekle
      this.addModernFooter()

      console.log("[v0] PDF generation completed successfully")
    } catch (error) {
      console.error("[v0] PDF oluşturma hatası:", error)
      throw error
    }
  }
}

export async function generateModernPDF(data: any): Promise<void> {
  try {
    console.log("[v0] Initializing PDF document...")

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    doc.setFont("helvetica")
    doc.setLanguage("tr")

    const generator = new ModernPDFGenerator(doc, data)
    await generator.generate()

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: tr })
    const filename = `kredi-raporu-${timestamp}.pdf`

    doc.save(filename)

    console.log("[v0] PDF başarıyla oluşturuldu:", filename)
  } catch (error) {
    console.error("[v0] PDF oluşturma hatası:", error)
    throw error
  }
}

export async function generatePDFReport(data: any): Promise<void> {
  return generateModernPDF(data)
}
