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
  private bankLogos: Map<string, string> = new Map()

  constructor(doc: jsPDF, data: any) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 15
    this.currentY = this.margin
    this.data = data
  }

  private async loadBankLogo(bankName: string, logoUrl?: string): Promise<string | null> {
    if (this.bankLogos.has(bankName)) {
      return this.bankLogos.get(bankName) || null
    }

    try {
      // Generate logo path from bank name if no logoUrl provided
      let imagePath = logoUrl
      if (!imagePath) {
        const normalizedName = bankName
          .toLowerCase()
          .replace(/ğ/g, "g")
          .replace(/ü/g, "u")
          .replace(/ş/g, "s")
          .replace(/ı/g, "i")
          .replace(/ö/g, "o")
          .replace(/ç/g, "c")
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
        imagePath = `/bank-icons/${normalizedName}.png`
      }

      // Load image and convert to base64
      const response = await fetch(imagePath)
      if (!response.ok) {
        console.warn(`Could not load bank logo: ${imagePath}`)
        return null
      }

      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          this.bankLogos.set(bankName, base64)
          resolve(base64)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.warn(`Error loading bank logo for ${bankName}:`, error)
      return null
    }
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

  private addBankInitials(logoX: number, logoY: number, bankName: string) {
    // White circle background
    this.doc.setFillColor(...COLORS.white)
    this.doc.circle(logoX, logoY, 7, "F")

    // Bank initials
    this.doc.setTextColor(...COLORS.primary)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    const initials = bankName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    this.doc.text(initials, logoX, logoY + 2, { align: "center" })
  }

  private async addCoverPage() {
    // Modern gradient background with darker tones
    this.addGradientRect(0, 0, this.pageWidth, this.pageHeight, COLORS.primary, COLORS.accent)

    // Add sophisticated decorative elements
    this.doc.setFillColor(255, 255, 255)
    this.doc.setGState(this.doc.GState({ opacity: 0.03 }))
    // Top right circle
    this.doc.circle(this.pageWidth * 0.85, this.pageHeight * 0.15, 60, "F")
    // Bottom left circle
    this.doc.circle(this.pageWidth * 0.15, this.pageHeight * 0.85, 50, "F")
    // Center decorative elements
    this.doc.circle(this.pageWidth * 0.25, this.pageHeight * 0.4, 35, "F")
    this.doc.circle(this.pageWidth * 0.75, this.pageHeight * 0.6, 40, "F")
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Logo section with modern container
    const logoY = this.pageHeight * 0.28
    const logoWidth = 60
    const logoHeight = 20

    try {
      // Load logo image
      const logoResponse = await fetch('/logo-white.png')
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob()
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(logoBlob)
        })

        // White container for logo with subtle shadow
        this.doc.setFillColor(255, 255, 255)
        this.doc.setGState(this.doc.GState({ opacity: 0.12 }))
        this.doc.roundedRect(
          this.pageWidth / 2 - logoWidth / 2 - 8,
          logoY - logoHeight / 2 - 8,
          logoWidth + 16,
          logoHeight + 16,
          8,
          8,
          "F"
        )
        this.doc.setGState(this.doc.GState({ opacity: 1 }))

        // Main logo container
        this.doc.setFillColor(255, 255, 255)
        this.doc.roundedRect(
          this.pageWidth / 2 - logoWidth / 2,
          logoY - logoHeight / 2,
          logoWidth,
          logoHeight,
          6,
          6,
          "F"
        )

        // Add logo image
        this.doc.addImage(
          logoBase64,
          "PNG",
          this.pageWidth / 2 - logoWidth / 2 + 2,
          logoY - logoHeight / 2 + 2,
          logoWidth - 4,
          logoHeight - 4
        )
      }
    } catch (error) {
      console.warn("Could not load logo, using fallback")
      // Fallback: Simple text logo
      this.doc.setFillColor(...COLORS.white)
      this.doc.roundedRect(
        this.pageWidth / 2 - 30,
        logoY - 15,
        60,
        30,
        6,
        6,
        "F"
      )
      this.doc.setTextColor(...COLORS.primary)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("KREDiTAKiP", this.pageWidth / 2, logoY + 3, { align: "center" })
    }

    // Main title section
    const titleY = this.pageHeight * 0.48
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(36)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText("KREDİ PORTFÖY"), this.pageWidth / 2, titleY, { align: "center" })

    this.doc.setFontSize(36)
    this.doc.text(safeText("RAPORU"), this.pageWidth / 2, titleY + 14, { align: "center" })

    // Elegant separator line
    this.doc.setDrawColor(...COLORS.white)
    this.doc.setLineWidth(0.5)
    this.doc.setGState(this.doc.GState({ opacity: 0.5 }))
    const lineWidth = 80
    this.doc.line(
      this.pageWidth / 2 - lineWidth / 2,
      titleY + 22,
      this.pageWidth / 2 + lineWidth / 2,
      titleY + 22
    )
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Subtitle
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "normal")
    this.doc.setGState(this.doc.GState({ opacity: 0.9 }))
    this.doc.text(safeText("Detaylı Finansal Analiz ve Değerlendirme"), this.pageWidth / 2, titleY + 34, { align: "center" })
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Modern info card
    const cardY = this.pageHeight * 0.68
    const cardWidth = 140
    const cardHeight = 60

    // Card shadow
    this.doc.setFillColor(0, 0, 0)
    this.doc.setGState(this.doc.GState({ opacity: 0.15 }))
    this.doc.roundedRect(
      this.pageWidth / 2 - cardWidth / 2 + 2,
      cardY + 2,
      cardWidth,
      cardHeight,
      8,
      8,
      "F"
    )

    // Card background
    this.doc.setGState(this.doc.GState({ opacity: 0.15 }))
    this.doc.setFillColor(255, 255, 255)
    this.doc.roundedRect(
      this.pageWidth / 2 - cardWidth / 2,
      cardY,
      cardWidth,
      cardHeight,
      8,
      8,
      "F"
    )
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Card border
    this.doc.setDrawColor(255, 255, 255)
    this.doc.setLineWidth(0.3)
    this.doc.setGState(this.doc.GState({ opacity: 0.4 }))
    this.doc.roundedRect(
      this.pageWidth / 2 - cardWidth / 2,
      cardY,
      cardWidth,
      cardHeight,
      8,
      8,
      "D"
    )
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // User info in card
    if (this.data.userData?.fullName || this.data.userData?.name) {
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(
        safeText(this.data.userData?.fullName || this.data.userData?.name),
        this.pageWidth / 2,
        cardY + 22,
        { align: "center" }
      )

      // Divider
      this.doc.setDrawColor(...COLORS.white)
      this.doc.setGState(this.doc.GState({ opacity: 0.3 }))
      this.doc.line(
        this.pageWidth / 2 - 30,
        cardY + 30,
        this.pageWidth / 2 + 30,
        cardY + 30
      )
      this.doc.setGState(this.doc.GState({ opacity: 1 }))
    }

    // Report date with icon
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "normal")
    this.doc.setGState(this.doc.GState({ opacity: 0.85 }))
    this.doc.text(safeText("RAPOR TARiHi"), this.pageWidth / 2, cardY + 40, { align: "center" })
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(formatDate(new Date())), this.pageWidth / 2, cardY + 50, { align: "center" })

    // Footer section with branding
    const footerY = this.pageHeight - 35

    // Footer line
    this.doc.setDrawColor(...COLORS.white)
    this.doc.setLineWidth(0.3)
    this.doc.setGState(this.doc.GState({ opacity: 0.3 }))
    this.doc.line(
      this.pageWidth * 0.3,
      footerY - 5,
      this.pageWidth * 0.7,
      footerY - 5
    )
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Website
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("kreditakip.com.tr", this.pageWidth / 2, footerY + 5, { align: "center" })

    // Tagline
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.setGState(this.doc.GState({ opacity: 0.7 }))
    this.doc.text(safeText("Finansal Özgürlüğe Giden Yol"), this.pageWidth / 2, footerY + 13, { align: "center" })
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Start a new page for content
    this.addPage()
  }

  private async addModernHeader() {
    // Header background
    this.addGradientRect(0, 0, this.pageWidth, 50, COLORS.primary, COLORS.accent)

    // Main title
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(20)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("KREDI PORTFOY RAPORU", this.margin, 28)

    // Subtitle
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Detayli Finansal Analiz", this.margin, 40)

    // Date - right aligned
    const rightX = this.pageWidth - this.margin
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.white)
    this.doc.text(formatDate(new Date()), rightX - 70, 20)

    // User full name from profile data
    if (this.data.userData?.fullName) {
      this.doc.setFont("helvetica", "bold")
      this.doc.setFontSize(10)
      this.doc.text(safeText(this.data.userData.fullName), rightX - 70, 32)
    } else if (this.data.userData?.name) {
      // Fallback to name field
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
    this.checkPageBreak(130)

    const cardWidth = this.pageWidth - 2 * this.margin
    const cardHeight = 125

    // Card container
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, cardWidth, cardHeight, "FD")

    // Header gradient
    const headerHeight = 24
    this.addGradientRect(this.margin, this.currentY, cardWidth, headerHeight, COLORS.primary, COLORS.secondary)

    // Bank logo with rounded background
    const logoX = this.margin + 12
    const logoY = this.currentY + headerHeight / 2
    const logoSize = 14
    const bgSize = 18

    // Try to load and display bank logo
    const bankName = safeText(credit.bankName || "Bilinmeyen Banka")
    const logoBase64 = await this.loadBankLogo(bankName, credit.logo_url)

    if (logoBase64) {
      try {
        // Light gradient background with rounded rectangle
        this.doc.setFillColor(255, 255, 255)
        this.doc.setDrawColor(240, 240, 240)
        this.doc.setLineWidth(0.3)
        this.doc.roundedRect(logoX - bgSize / 2, logoY - bgSize / 2, bgSize, bgSize, 3, 3, "FD")

        // Add bank logo image (slightly smaller than background)
        this.doc.addImage(logoBase64, "PNG", logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize)
      } catch (error) {
        console.warn("Could not add bank logo image:", error)
        // Fallback to initials
        this.addBankInitials(logoX, logoY, bankName)
      }
    } else {
      // Fallback to initials if logo not found
      this.addBankInitials(logoX, logoY, bankName)
    }

    // Bank name and credit type
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    const creditTypeText = safeText(credit.creditType || "Kredi")
    this.doc.text(`${bankName} - ${creditTypeText}`, this.margin + 28, this.currentY + 15)

    // Status badge
    if (credit.status === "active") {
      const statusX = this.pageWidth - this.margin - 45
      const statusY = this.currentY + 6
      this.doc.setFillColor(236, 253, 245)
      this.doc.roundedRect(statusX, statusY, 38, 13, 2, 2, "F")
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(8)
      this.doc.text("AKTIF", statusX + 19, statusY + 9, { align: "center" })
    }

    // Progress bar section - moved further down from header
    const progressY = this.currentY + headerHeight + 18
    const progressBarWidth = cardWidth - 24
    const progressBarHeight = 6
    const progressBarX = this.margin + 12

    // Calculate progress exactly like credits page: paid installments / total installments
    let progressPercentage = 0
    const totalInstallments = credit.total_installments || 0
    const remainingInstallments = credit.remaining_installments || 0

    if (credit.payment_progress !== undefined && credit.payment_progress !== null) {
      // Use payment_progress directly from database (already calculated correctly)
      progressPercentage = credit.payment_progress
    } else if (totalInstallments > 0) {
      // Calculate: (paid installments / total installments) * 100
      const paidInstallments = totalInstallments - remainingInstallments
      progressPercentage = (paidInstallments / totalInstallments) * 100
    }

    // Ensure percentage is between 0 and 100
    progressPercentage = Math.max(0, Math.min(100, progressPercentage))

    // Progress percentage text - positioned above progress bar with more space
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`%${progressPercentage.toFixed(1)} ODENDI`, progressBarX, progressY - 4)

    // Progress bar background
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.rect(progressBarX, progressY, progressBarWidth, progressBarHeight, "F")

    // Progress bar fill
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(progressBarX, progressY, (progressBarWidth * progressPercentage) / 100, progressBarHeight, "F")

    // Content in 2x2 grid with improved spacing
    const contentY = progressY + 22
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

  private async addSummarySection() {
    // Start on a new page for summary
    this.addPage()

    // Page title with gradient background
    this.addGradientRect(0, 0, this.pageWidth, 45, COLORS.primary, COLORS.secondary)
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RAPOR OZETI VE ANALIZ", this.pageWidth / 2, 28, { align: "center" })

    this.currentY = 58

    // Main summary metrics (4 cards like first page)
    await this.addMainSummaryMetrics()

    this.currentY += 8

    // Calculate bank summary data
    const bankSummary = this.calculateBankSummary()

    // Financial highlights section
    await this.addFinancialHighlights()

    this.currentY += 8

    // Bank overview section with logos
    await this.addBankOverviewSection(bankSummary)

    this.currentY += 12

    // Add professional charts based on user selection
    await this.addSelectedCharts()
  }

  private async addSelectedCharts() {
    const selectedReports = this.data.selectedReports || []

    console.log("Selected Reports:", selectedReports)
    console.log("Chart Data:", this.data.chartData)

    if (selectedReports.length === 0) {
      console.log("No charts selected, skipping chart section")
      return // No charts selected
    }

    // Charts section header
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, 2, 2, "F")
    this.doc.setFillColor(...COLORS.secondary)
    this.doc.rect(this.margin, this.currentY, 4, 18, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("GRAFIK ANALIZLER", this.margin + 10, this.currentY + 12)

    this.currentY += 26

    const chartWidth = (this.pageWidth - 2 * this.margin - 10) / 2
    const chartHeight = 85
    const spacing = 10

    let chartsInRow = 0

    // Payment Trend Chart
    if (selectedReports.includes("paymentTrend")) {
      console.log("Drawing Payment Trend Chart")
      const beforeY = this.currentY
      this.checkPageBreak(chartHeight + 10)
      if (this.currentY !== beforeY) chartsInRow = 0 // Reset if page changed

      await this.drawPaymentTrendChart(
        chartsInRow === 0 ? this.margin : this.margin + chartWidth + spacing,
        this.currentY,
        chartWidth,
        chartHeight
      )
      chartsInRow++
      if (chartsInRow === 2) {
        this.currentY += chartHeight + spacing
        chartsInRow = 0
      }
    }

    // Debt Distribution Chart
    if (selectedReports.includes("debtDistribution")) {
      console.log("Drawing Debt Distribution Chart")
      const beforeY = this.currentY
      this.checkPageBreak(chartHeight + 10)
      if (this.currentY !== beforeY) chartsInRow = 0 // Reset if page changed

      await this.drawDebtDistributionChart(
        chartsInRow === 0 ? this.margin : this.margin + chartWidth + spacing,
        this.currentY,
        chartWidth,
        chartHeight
      )
      chartsInRow++
      if (chartsInRow === 2) {
        this.currentY += chartHeight + spacing
        chartsInRow = 0
      }
    }

    // Bank Comparison Chart
    if (selectedReports.includes("bankComparison")) {
      console.log("Drawing Bank Comparison Chart")
      const beforeY = this.currentY
      this.checkPageBreak(chartHeight + 10)
      if (this.currentY !== beforeY) chartsInRow = 0 // Reset if page changed

      await this.drawBankComparisonChart(
        chartsInRow === 0 ? this.margin : this.margin + chartWidth + spacing,
        this.currentY,
        chartWidth,
        chartHeight
      )
      chartsInRow++
      if (chartsInRow === 2) {
        this.currentY += chartHeight + spacing
        chartsInRow = 0
      }
    }

    // Interest Comparison Chart
    if (selectedReports.includes("interestComparison")) {
      console.log("Drawing Interest Comparison Chart")
      const beforeY = this.currentY
      this.checkPageBreak(chartHeight + 10)
      if (this.currentY !== beforeY) chartsInRow = 0 // Reset if page changed

      await this.drawInterestComparisonChart(
        chartsInRow === 0 ? this.margin : this.margin + chartWidth + spacing,
        this.currentY,
        chartWidth,
        chartHeight
      )
      chartsInRow++
      if (chartsInRow === 2) {
        this.currentY += chartHeight + spacing
        chartsInRow = 0
      }
    }

    // Payment Progress Chart (full width)
    if (selectedReports.includes("paymentProgress")) {
      console.log("Drawing Payment Progress Chart")
      if (chartsInRow > 0) {
        this.currentY += chartHeight + spacing
        chartsInRow = 0
      }
      this.checkPageBreak(75)
      await this.drawPaymentProgressChart(
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        70
      )
      this.currentY += 75
    } else if (chartsInRow > 0) {
      // If we have charts in the current row but not ending with progress
      this.currentY += chartHeight + spacing
    }
  }

  private async addMainSummaryMetrics() {
    // 4 metric cards in a row (same as first page but enhanced)
    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4
    const cardHeight = 42
    const spacing = 10

    const totalInterest =
      this.data.credits?.reduce((sum: number, credit: any) => {
        const monthly = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 100 / 12
        return sum + monthly * 12
      }, 0) || 0

    const avgRate =
      this.data.credits?.length > 0
        ? this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length
        : 0

    const totalPaid = this.data.totalPayment - this.data.totalDebt

    const metrics = [
      {
        title: "Toplam Kredi",
        value: `${this.data.totalCredits || 0}`,
        subtitle: `${this.data.activeCredits || 0} aktif`,
        color: "primary" as keyof typeof COLORS,
      },
      {
        title: "Toplam Borc",
        value: formatCurrency(this.data.totalDebt || 0),
        subtitle: "kalan",
        color: "danger" as keyof typeof COLORS,
      },
      {
        title: "Aylik Odeme",
        value: formatCurrency(this.data.monthlyPayment || 0),
        subtitle: "taksit",
        color: "warning" as keyof typeof COLORS,
      },
      {
        title: "Odenen Tutar",
        value: formatCurrency(totalPaid),
        subtitle: "toplam",
        color: "success" as keyof typeof COLORS,
      },
    ]

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + spacing)
      const color = COLORS[metric.color]

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
      this.doc.text(safeText(metric.value), x + 4, this.currentY + 24)

      // Subtitle
      if (metric.subtitle) {
        this.doc.setFontSize(6)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        this.doc.text(safeText(metric.subtitle), x + 4, this.currentY + 34)
      }
    })

    this.currentY += cardHeight + 12
  }

  private async addFinancialHighlights() {
    // Section header
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, 2, 2, "F")
    this.doc.setFillColor(...COLORS.success)
    this.doc.rect(this.margin, this.currentY, 4, 18, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("FINANSAL ONEMLI NOKTALAR", this.margin + 10, this.currentY + 12)

    this.currentY += 24

    // Calculate highlights
    const avgRate =
      this.data.credits?.length > 0
        ? this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length
        : 0

    const maxRate = this.data.credits?.length > 0
      ? Math.max(...this.data.credits.map((c: any) => c.interestRate || 0))
      : 0

    const minRate = this.data.credits?.length > 0
      ? Math.min(...this.data.credits.map((c: any) => c.interestRate || 0))
      : 0

    const totalInterest =
      this.data.credits?.reduce((sum: number, credit: any) => {
        const monthly = ((credit.remainingDebt || 0) * (credit.interestRate || 0)) / 100 / 12
        return sum + monthly * 12
      }, 0) || 0

    const avgProgress = this.data.credits?.length > 0
      ? this.data.credits.reduce((sum: number, c: any) => sum + (c.payment_progress || 0), 0) / this.data.credits.length
      : 0

    // 6 highlight boxes in 3x2 grid
    const boxWidth = (this.pageWidth - 2 * this.margin - 20) / 3
    const boxHeight = 32
    const spacing = 10

    const highlights = [
      { label: "Ortalama Faiz", value: `%${avgRate.toFixed(2)}`, color: COLORS.info },
      { label: "En Yuksek Faiz", value: `%${maxRate.toFixed(2)}`, color: COLORS.danger },
      { label: "En Dusuk Faiz", value: `%${minRate.toFixed(2)}`, color: COLORS.success },
      { label: "Yillik Faiz Maliyeti", value: formatCurrency(totalInterest), color: COLORS.warning },
      { label: "Ortalama Ilerleme", value: `%${avgProgress.toFixed(0)}`, color: COLORS.primary },
      { label: "Toplam Banka", value: `${new Set(this.data.credits?.map((c: any) => c.bankName)).size}`, color: COLORS.secondary },
    ]

    highlights.forEach((highlight, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      const x = this.margin + col * (boxWidth + spacing)
      const y = this.currentY + row * (boxHeight + spacing)

      // Box background
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(220, 220, 220)
      this.doc.setLineWidth(0.3)
      this.doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "FD")

      // Left colored bar
      this.doc.setFillColor(...highlight.color)
      this.doc.rect(x, y, 3, boxHeight, "F")

      // Label
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(6)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(safeText(highlight.label).toUpperCase(), x + 8, y + 10)

      // Value
      this.doc.setTextColor(...highlight.color)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(safeText(highlight.value), x + 8, y + 22)
    })

    this.currentY += 2 * (boxHeight + spacing) + 5
  }


  private async addBankOverviewSection(bankSummary: any[]) {
    // Section header
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, 2, 2, "F")
    this.doc.setFillColor(...COLORS.info)
    this.doc.rect(this.margin, this.currentY, 4, 18, "F")
    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("BANKA BAZINDA DETAYLI OZET", this.margin + 10, this.currentY + 12)

    // Total bank count
    this.doc.setTextColor(...COLORS.gray)
    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`${bankSummary.length} banka`, this.pageWidth - this.margin - 35, this.currentY + 12)

    this.currentY += 24

    // Bank cards - 2 per row
    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 2
    const cardHeight = 55
    const spacing = 10

    for (let i = 0; i < Math.min(bankSummary.length, 6); i++) {
      const bank = bankSummary[i]
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = this.margin + col * (cardWidth + spacing)
      const y = this.currentY + row * (cardHeight + spacing)

      // Check if we need a new page
      if (y + cardHeight > this.pageHeight - 50) {
        this.addPage()
        this.currentY = 20
        continue
      }

      // Card shadow
      this.doc.setFillColor(245, 245, 245)
      this.doc.rect(x + 2, y + 2, cardWidth, cardHeight, "F")

      // Card background
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(220, 220, 220)
      this.doc.setLineWidth(0.3)
      this.doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD")

      // Bank logo and name section
      const logoY = y + 12
      const logoSize = 16

      // Try to load bank logo
      const logoBase64 = await this.loadBankLogo(bank.name, bank.logo_url)

      if (logoBase64) {
        // Logo background
        this.doc.setFillColor(250, 250, 250)
        this.doc.roundedRect(x + 8, logoY - 8, 20, 20, 2, 2, "F")
        this.doc.addImage(logoBase64, "PNG", x + 10, logoY - 6, logoSize, logoSize)
      } else {
        // Fallback initials
        this.doc.setFillColor(250, 250, 250)
        this.doc.roundedRect(x + 8, logoY - 8, 20, 20, 2, 2, "F")
        this.doc.setTextColor(...COLORS.primary)
        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "bold")
        const initials = bank.name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
        this.doc.text(initials, x + 18, logoY + 2, { align: "center" })
      }

      // Bank name
      this.doc.setTextColor(...COLORS.dark)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "bold")
      const bankName = safeText(bank.name).substring(0, 18)
      this.doc.text(bankName, x + 33, logoY + 2)

      // Divider line
      this.doc.setDrawColor(240, 240, 240)
      this.doc.setLineWidth(0.5)
      this.doc.line(x + 8, y + 26, x + cardWidth - 8, y + 26)

      // Stats in 3 columns with improved spacing
      const statY = y + 35
      const col1X = x + 10
      const col2X = x + cardWidth * 0.38
      const col3X = x + cardWidth * 0.68

      // Column 1 - Credit count
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(6)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("KREDI SAYISI", col1X, statY)
      this.doc.setTextColor(...COLORS.primary)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${bank.count} adet`, col1X, statY + 9)

      // Column 2 - Total debt
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(6)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("KALAN BORC", col2X, statY)
      this.doc.setTextColor(...COLORS.danger)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(formatCurrency(bank.amount).substring(0, 10), col2X, statY + 9)

      // Column 3 - Interest rate
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(6)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("ORT. FAIZ", col3X, statY)
      this.doc.setTextColor(...COLORS.warning)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${bank.avgRate.toFixed(1)}`, col3X, statY + 9)
    }

    // Calculate how many rows we used
    const rows = Math.ceil(Math.min(bankSummary.length, 6) / 2)
    this.currentY += rows * (cardHeight + spacing)
  }

  private calculateBankSummary() {
    if (!this.data.credits || this.data.credits.length === 0) return []

    const bankMap = new Map()

    this.data.credits.forEach((credit: any) => {
      const bankName = credit.bankName || "Bilinmeyen Banka"
      const amount = credit.remainingDebt || 0
      const rate = credit.interestRate || 0
      const logoUrl = credit.logo_url

      if (bankMap.has(bankName)) {
        const existing = bankMap.get(bankName)
        existing.count += 1
        existing.amount += amount
        existing.totalRate += rate
      } else {
        bankMap.set(bankName, {
          name: bankName,
          count: 1,
          amount,
          totalRate: rate,
          logo_url: logoUrl,
        })
      }
    })

    return Array.from(bankMap.values())
      .map((bank) => ({
        ...bank,
        avgRate: bank.totalRate / bank.count,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Payment Trend Chart - Line/Area chart showing monthly payments
  private async drawPaymentTrendChart(x: number, y: number, width: number, height: number) {
    // Modern chart container
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Odeme Trendi", x + 10, y + 12)

    const data = this.data.chartData?.monthlyPayments || []
    if (data.length === 0) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Veri bulunamadi", x + width / 2, y + height / 2, { align: "center" })
      return
    }

    const chartAreaY = y + 22
    const chartAreaHeight = height - 30
    const chartAreaWidth = width - 20

    const maxAmount = Math.max(...data.map((d: any) => d.amount))
    const months = data.slice(0, 6) // Show last 6 months

    months.forEach((item: any, index: number) => {
      const barX = x + 10 + (index * chartAreaWidth) / 6
      const barHeight = (item.amount / maxAmount) * (chartAreaHeight - 20)
      const barWidth = chartAreaWidth / 6 - 8

      // Bar
      this.doc.setFillColor(...COLORS.primary)
      this.doc.roundedRect(barX, chartAreaY + chartAreaHeight - barHeight - 15, barWidth, barHeight, 1, 1, "F")

      // Month label
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(6)
      const monthLabel = item.month.substring(0, 3)
      this.doc.text(monthLabel, barX + barWidth / 2, chartAreaY + chartAreaHeight - 5, { align: "center" })
    })
  }

  // Debt Distribution Chart - Horizontal bar chart
  private async drawDebtDistributionChart(x: number, y: number, width: number, height: number) {
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    this.doc.setFillColor(...COLORS.danger)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Borc Dagilimi", x + 10, y + 12)

    const data = this.data.chartData?.creditDistribution || []
    if (data.length === 0) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Veri bulunamadi", x + width / 2, y + height / 2, { align: "center" })
      return
    }

    const colors = [COLORS.danger, COLORS.warning, COLORS.info, COLORS.success, COLORS.primary]
    const total = data.reduce((sum: number, item: any) => sum + (item.value || item.amount || 0), 0)

    if (total === 0) return

    const barStartY = y + 22
    const barHeight = 8
    const maxBarWidth = width - 90

    data.slice(0, 5).forEach((item: any, index: number) => {
      const barY = barStartY + index * 12
      const itemValue = item.value || item.amount || 0
      const percentage = (itemValue / total) * 100
      const barWidth = Math.max(1, (percentage / 100) * maxBarWidth) // Minimum 1 to avoid errors

      // Bank name
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      const label = safeText(item.name).substring(0, 15)
      this.doc.text(label, x + 8, barY + 6)

      // Bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.rect(x + 8, barY, maxBarWidth, barHeight, "F")

      // Bar fill
      this.doc.setFillColor(...colors[index % colors.length])
      this.doc.rect(x + 8, barY, barWidth, barHeight, "F")

      // Percentage
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...colors[index % colors.length])
      this.doc.text(`%${percentage.toFixed(1)}`, x + 12 + maxBarWidth, barY + 6)
    })
  }

  // Bank Comparison Chart
  private async drawBankComparisonChart(x: number, y: number, width: number, height: number) {
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    this.doc.setFillColor(...COLORS.info)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Banka Karsilastirmasi", x + 10, y + 12)

    const data = this.data.chartData?.bankComparison || []
    if (data.length === 0) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Veri bulunamadi", x + width / 2, y + height / 2, { align: "center" })
      return
    }

    const maxDebt = Math.max(...data.map((d: any) => d.totalDebt))
    if (maxDebt === 0) return

    const barStartY = y + 22
    const barHeight = 8
    const maxBarWidth = width - 90

    data.slice(0, 5).forEach((item: any, index: number) => {
      const barY = barStartY + index * 12
      const barWidth = Math.max(1, (item.totalDebt / maxDebt) * maxBarWidth)

      // Bank name
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      const label = safeText(item.bank).substring(0, 15)
      this.doc.text(label, x + 8, barY + 6)

      // Bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.rect(x + 8, barY, maxBarWidth, barHeight, "F")

      // Bar fill
      this.doc.setFillColor(...COLORS.info)
      this.doc.rect(x + 8, barY, barWidth, barHeight, "F")

      // Debt amount
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...COLORS.info)
      const debtShort = item.totalDebt >= 1000 ? `${(item.totalDebt / 1000).toFixed(0)}K` : `${item.totalDebt}`
      this.doc.text(debtShort, x + 12 + maxBarWidth, barY + 6)
    })
  }

  // Interest Comparison Chart
  private async drawInterestComparisonChart(x: number, y: number, width: number, height: number) {
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    this.doc.setFillColor(...COLORS.warning)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Faiz Oranlari Analizi", x + 10, y + 12)

    const data = this.data.chartData?.interestAnalysis || []
    if (data.length === 0) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Veri bulunamadi", x + width / 2, y + height / 2, { align: "center" })
      return
    }

    const sortedData = [...data].sort((a: any, b: any) => b.rate - a.rate).slice(0, 5)
    const maxRate = Math.max(...sortedData.map((d: any) => d.rate))
    if (maxRate === 0) return

    const avgRate = data.reduce((sum: number, d: any) => sum + d.rate, 0) / data.length

    const barStartY = y + 22
    const barHeight = 8
    const maxBarWidth = width - 80

    sortedData.forEach((item: any, index: number) => {
      const barY = barStartY + index * 12
      const barWidth = Math.max(1, (item.rate / maxRate) * maxBarWidth)

      // Bank name
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      const label = safeText(item.bank).substring(0, 12)
      this.doc.text(label, x + 8, barY + 6)

      // Bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.rect(x + 8, barY, maxBarWidth, barHeight, "F")

      // Bar fill - color based on rate vs average
      const barColor = item.rate > avgRate ? COLORS.danger : COLORS.success
      this.doc.setFillColor(...barColor)
      this.doc.rect(x + 8, barY, barWidth, barHeight, "F")

      // Rate value
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...barColor)
      this.doc.text(`%${item.rate.toFixed(1)}`, x + 12 + maxBarWidth, barY + 6)
    })

    // Average line indicator
    this.doc.setFontSize(6)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Ort: %${avgRate.toFixed(1)}`, x + 10, y + height - 5)
  }

  // Payment Progress Chart (full width)
  private async drawPaymentProgressChart(x: number, y: number, width: number, height: number) {
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")
    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    this.doc.setFillColor(...COLORS.success)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Odeme Ilerleme Durumu Takibi", x + 10, y + 12)

    const credits = this.data.credits || []
    if (credits.length === 0) {
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Veri bulunamadi", x + width / 2, y + height / 2, { align: "center" })
      return
    }

    const barStartY = y + 22
    const maxItems = Math.min(credits.length, 4)
    const barHeight = 10
    const barWidth = width - 160

    for (let i = 0; i < maxItems; i++) {
      const credit = credits[i]
      let progressPercentage = 0

      const totalInstallments = credit.total_installments || 0
      const remainingInstallments = credit.remaining_installments || 0

      if (credit.payment_progress !== undefined) {
        progressPercentage = credit.payment_progress
      } else if (totalInstallments > 0) {
        const paidInstallments = totalInstallments - remainingInstallments
        progressPercentage = (paidInstallments / totalInstallments) * 100
      }

      progressPercentage = Math.max(0, Math.min(100, progressPercentage))

      const barY = barStartY + i * 13

      // Bank name and credit type
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      const label = `${safeText(credit.bankName || "").substring(0, 14)} - ${safeText(credit.creditType || "").substring(0, 10)}`
      this.doc.text(label, x + 8, barY + 7)

      // Progress bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.rect(x + 110, barY + 1, barWidth, barHeight, "F")

      // Progress bar fill
      const fillColor =
        progressPercentage > 75 ? COLORS.success : progressPercentage > 50 ? COLORS.warning : COLORS.danger
      const fillWidth = Math.max(1, (barWidth * progressPercentage) / 100)
      this.doc.setFillColor(...fillColor)
      this.doc.rect(x + 110, barY + 1, fillWidth, barHeight, "F")

      // Percentage text
      this.doc.setTextColor(...fillColor)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${progressPercentage.toFixed(0)}`, x + 115 + barWidth, barY + 7)
    }
  }

  private drawProfessionalPieChart(x: number, y: number, width: number, height: number, title: string, data: any[]) {
    // Modern chart container with shadow
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")

    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    // Modern title with gradient bar
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + 10, y + 12)

    const colors = [COLORS.primary, COLORS.info, COLORS.warning, COLORS.success, COLORS.danger]
    const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0)

    // Modern horizontal bar chart instead of pie
    const barStartY = y + 22
    const barHeight = 8
    const maxBarWidth = width - 90

    data.slice(0, 5).forEach((item, index) => {
      const barY = barStartY + index * 12
      const itemValue = item.value || item.amount || 0
      const percentage = (itemValue / total) * 100
      const barWidth = (percentage / 100) * maxBarWidth

      // Bank name
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(...COLORS.gray)
      const label = safeText(item.name).substring(0, 15)
      this.doc.text(label, x + 8, barY + 6)

      // Bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.roundedRect(x + 8, barY, maxBarWidth, barHeight, 1, 1, "F")

      // Bar fill with gradient effect
      this.doc.setFillColor(...colors[index % colors.length])
      this.doc.roundedRect(x + 8, barY, barWidth, barHeight, 1, 1, "F")

      // Percentage text
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(...colors[index % colors.length])
      this.doc.text(`%${percentage.toFixed(1)}`, x + 12 + maxBarWidth, barY + 6)
    })
  }

  private drawProfessionalBarChart(x: number, y: number, width: number, height: number, title: string, credits: any[]) {
    // Modern chart container with shadow
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")

    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    // Modern title with gradient bar
    this.doc.setFillColor(...COLORS.info)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + 10, y + 12)

    // Sort credits by interest rate
    const sortedCredits = [...credits].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0)).slice(0, 5)
    const maxRate = Math.max(...sortedCredits.map((c) => c.interestRate || 0))

    const barStartY = y + 22
    const barHeight = 8
    const maxBarWidth = width - 80

    const avgRate =
      this.data.credits.reduce((sum: number, c: any) => sum + (c.interestRate || 0), 0) / this.data.credits.length

    sortedCredits.forEach((credit, index) => {
      const rate = credit.interestRate || 0
      const barWidth = (rate / maxRate) * maxBarWidth
      const barY = barStartY + index * 12

      // Bank name
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      const bankName = safeText(credit.bankName || "Diger").substring(0, 12)
      this.doc.text(bankName, x + 8, barY + 6)

      // Bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.roundedRect(x + 8, barY, maxBarWidth, barHeight, 1, 1, "F")

      // Bar fill - color based on rate comparison to average
      const barColor = rate > avgRate ? COLORS.danger : COLORS.success
      this.doc.setFillColor(...barColor)
      this.doc.roundedRect(x + 8, barY, barWidth, barHeight, 1, 1, "F")

      // Rate value
      this.doc.setTextColor(...barColor)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${rate.toFixed(1)}`, x + 12 + maxBarWidth, barY + 6)
    })

    // Average indicator at bottom
    this.doc.setFontSize(6)
    this.doc.setTextColor(...COLORS.warning)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Ortalama: %${avgRate.toFixed(1)}`, x + 10, y + height - 5)
  }

  private drawProfessionalProgressChart(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    credits: any[],
  ) {
    // Modern chart container with shadow
    this.doc.setFillColor(245, 245, 245)
    this.doc.rect(x + 2, y + 2, width, height, "F")

    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(230, 230, 230)
    this.doc.setLineWidth(0.3)
    this.doc.roundedRect(x, y, width, height, 2, 2, "FD")

    // Modern title with gradient bar
    this.doc.setFillColor(...COLORS.secondary)
    this.doc.rect(x, y, 4, height, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, x + 10, y + 12)

    // Progress bars with modern styling
    const barStartY = y + 22
    const maxItems = Math.min(credits.length, 4)
    const barHeight = 10
    const barWidth = width - 160

    for (let i = 0; i < maxItems; i++) {
      const credit = credits[i]
      let progressPercentage = 0

      const totalInstallments = credit.total_installments || 0
      const remainingInstallments = credit.remaining_installments || 0

      if (credit.payment_progress !== undefined) {
        progressPercentage = credit.payment_progress
      } else if (totalInstallments > 0) {
        const paidInstallments = totalInstallments - remainingInstallments
        progressPercentage = (paidInstallments / totalInstallments) * 100
      }

      progressPercentage = Math.max(0, Math.min(100, progressPercentage))

      const barY = barStartY + i * 13

      // Bank name and credit type
      this.doc.setTextColor(...COLORS.gray)
      this.doc.setFontSize(7)
      this.doc.setFont("helvetica", "normal")
      const label = `${safeText(credit.bankName || "").substring(0, 14)} - ${safeText(credit.creditType || "").substring(0, 10)}`
      this.doc.text(label, x + 8, barY + 7)

      // Progress bar background
      this.doc.setFillColor(245, 245, 245)
      this.doc.roundedRect(x + 110, barY + 1, barWidth, barHeight, 2, 2, "F")

      // Progress bar fill with smooth gradient
      const fillColor =
        progressPercentage > 75 ? COLORS.success : progressPercentage > 50 ? COLORS.warning : COLORS.danger
      this.doc.setFillColor(...fillColor)
      this.doc.roundedRect(x + 110, barY + 1, (barWidth * progressPercentage) / 100, barHeight, 2, 2, "F")

      // Percentage text with badge style
      this.doc.setTextColor(...fillColor)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${progressPercentage.toFixed(0)}`, x + 115 + barWidth, barY + 7)
    }
  }

  private addModernFooter() {
    // @ts-ignore - getNumberOfPages may not be in type definitions
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
      // Add modern cover page
      await this.addCoverPage()

      // Add header on second page
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
      this.addModernSection("BANKA DAGILIMI", "info", true) // Force new page
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
      this.addModernSection("KREDI TURU DAGILIMI", "secondary", true) // Force new page
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
        this.addModernSection("FAIZ ANALIZI", "warning", true) // Force new page
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

      // Rapor Ozeti - addSummarySection already creates its own page and header
      await this.addSummarySection()

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
