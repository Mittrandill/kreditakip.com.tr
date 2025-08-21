import jsPDF from "jspdf"
import { format } from "date-fns"

const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined || value === "") return defaultValue
  const num = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

const safeCoordinate = (value: any, min = 0, max = 1000): number => {
  const num = safeNumber(value, min)
  return Math.max(min, Math.min(max, num))
}

const removeTurkishChars = (text: string): string => {
  if (!text || typeof text !== "string") return ""

  const charMap: { [key: string]: string } = {
    ç: "c",
    Ç: "C",
    ğ: "g",
    Ğ: "G",
    ı: "i",
    İ: "I",
    ö: "o",
    Ö: "O",
    ş: "s",
    Ş: "S",
    ü: "u",
    Ü: "U",
    â: "a",
    Â: "A",
    î: "i",
    Î: "I",
    û: "u",
    Û: "U",
    ë: "e",
    Ë: "E",
    ï: "i",
    Ï: "I",
    ô: "o",
    Ô: "O",
    ù: "u",
    Ù: "U",
    à: "a",
    À: "A",
    è: "e",
    È: "E",
    é: "e",
    É: "E",
    ê: "e",
    Ê: "E",
  }

  return text.replace(/[çğıöşüÇĞİÖŞÜâîûÂÎÛëïôùàèéêËÏÔÙÀÈÉÊ]/g, (match) => charMap[match] || match)
}

const safeText = (text: any): string => {
  if (text === null || text === undefined) return ""
  return removeTurkishChars(String(text))
}

const formatCurrency = (amount: any): string => {
  const num = safeNumber(amount, 0)
  return (
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(num)
      .replace("₺", "")
      .trim() + " TL"
  )
}

const COLORS = {
  primary: [20, 83, 136], // Professional blue
  secondary: [71, 85, 105], // Slate gray
  accent: [16, 185, 129], // Emerald green
  text: [15, 23, 42], // Dark slate
  textLight: [100, 116, 139], // Light slate
  border: [226, 232, 240], // Light border
  background: [248, 250, 252], // Light background
  white: [255, 255, 255],
  success: [34, 197, 94],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
}

export interface ReportData {
  reportTitle?: string
  period?: {
    from?: Date
    to?: Date
    type?: string
  }
  userData: {
    name: string
    email: string
  }
  totalCredits: number
  activeCredits: number
  closedCredits: number
  totalDebt: number
  totalPayment: number
  monthlyPayment: number
  credits: Array<{
    id: string
    bankName: string
    creditType: string
    remainingDebt: number
    monthlyPayment: number
    interestRate: number
    status: string
    amount: number
    remainingInstallments?: number
    totalInstallments?: number
    startDate?: string | Date
    endDate?: string | Date
    paidAmount?: number
  }>
  selectedReports?: string[]
  chartData?: {
    monthlyPayments?: any[]
    creditDistribution?: any[]
    interestAnalysis?: any[]
    paymentCalendar?: any[]
    bankDistribution?: any[]
    paymentTrend?: any[]
  }
  selectedBanks?: string[]
  includeSections?: {
    summary?: boolean
    creditDetails?: boolean
    paymentSchedule?: boolean
    interestAnalysis?: boolean
    riskAssessment?: boolean
  }
  chartOptions?: {
    paymentTrend?: boolean
    debtDistribution?: boolean
    bankComparison?: boolean
    interestComparison?: boolean
    paymentProgress?: boolean
  }
}

class PDFReportGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private pageNumber: number

  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 25
    this.currentY = this.margin
    this.pageNumber = 1
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = this.margin
    this.addPageHeader()
  }

  private checkPageBreak(requiredHeight: number, forceBreak = false) {
    const footerSpace = 50
    const availableSpace = this.pageHeight - this.currentY - footerSpace

    if (forceBreak || requiredHeight > availableSpace || availableSpace < 60) {
      this.addPageFooter()
      this.addPage()
      return true
    }
    return false
  }

  private addPageHeader() {
    try {
      // Header background
      this.doc.setFillColor(...COLORS.primary)
      this.doc.rect(0, 0, this.pageWidth, 15, "F")

      // Page number
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Sayfa ${this.pageNumber}`, this.pageWidth - this.margin, 10, { align: "right" })

      // Company/App name
      this.doc.text("KrediTakip.com.tr", this.margin, 10)

      this.currentY = 35
    } catch (error) {
      console.error("Error in addPageHeader:", error)
      this.currentY = 35
    }
  }

  private addPageFooter() {
    try {
      const footerY = this.pageHeight - 20

      // Footer line
      this.doc.setDrawColor(...COLORS.border)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10)

      // Footer text
      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(8)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Bu rapor KrediTakip.com.tr tarafindan olusturulmustur.", this.margin, footerY)
      this.doc.text(format(new Date(), "dd.MM.yyyy HH:mm"), this.pageWidth - this.margin, footerY, { align: "right" })
    } catch (error) {
      console.error("Error in addPageFooter:", error)
    }
  }

  private addMainHeader(data: ReportData) {
    try {
      // Background accent
      this.doc.setFillColor(...COLORS.background)
      this.doc.rect(0, 15, this.pageWidth, 80, "F")

      // Main title
      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(32)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Odemeleri", this.margin, this.currentY + 25)

      this.doc.setFontSize(32)
      this.doc.setFont("helvetica", "300")
      this.doc.text("Raporu", this.margin, this.currentY + 50)

      // Date with modern styling
      this.doc.setFillColor(...COLORS.primary)
      this.doc.roundedRect(this.pageWidth - 120, this.currentY + 10, 95, 25, 3, 3, "F")

      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      const currentDate = format(new Date(), "dd MMMM yyyy")
      this.doc.text(safeText(currentDate), this.pageWidth - 72, this.currentY + 27, { align: "center" })

      // User info
      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Rapor Sahibi: ${safeText(data.userData.name)}`, this.margin, this.currentY + 70)

      this.currentY += 100
    } catch (error) {
      console.error("Error in addMainHeader:", error)
      this.currentY += 100
    }
  }

  private addSummarySection(data: ReportData) {
    try {
      this.checkPageBreak(140)

      // Section header
      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Finansal Ozet", this.margin, this.currentY)
      this.currentY += 30

      // Modern cards layout
      const cardWidth = (this.pageWidth - 2 * this.margin - 20) / 3
      const cardHeight = 60

      // Card 1 - Total Amount
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(...COLORS.border)
      this.doc.roundedRect(this.margin, this.currentY, cardWidth, cardHeight, 5, 5, "FD")

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("TOPLAM KREDI", this.margin + 10, this.currentY + 15)

      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(formatCurrency(data.totalPayment), this.margin + 10, this.currentY + 35)

      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`${data.totalCredits} adet kredi`, this.margin + 10, this.currentY + 50)

      // Card 2 - Remaining Debt
      const card2X = this.margin + cardWidth + 10
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(...COLORS.border)
      this.doc.roundedRect(card2X, this.currentY, cardWidth, cardHeight, 5, 5, "FD")

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(10)
      this.doc.text("KALAN BORC", card2X + 10, this.currentY + 15)

      this.doc.setTextColor(...COLORS.danger)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(formatCurrency(data.totalDebt), card2X + 10, this.currentY + 35)

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`${data.activeCredits} aktif kredi`, card2X + 10, this.currentY + 50)

      // Card 3 - Monthly Payment
      const card3X = this.margin + 2 * (cardWidth + 10)
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(...COLORS.border)
      this.doc.roundedRect(card3X, this.currentY, cardWidth, cardHeight, 5, 5, "FD")

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(10)
      this.doc.text("AYLIK ODEME", card3X + 10, this.currentY + 15)

      this.doc.setTextColor(...COLORS.primary)
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(formatCurrency(data.monthlyPayment), card3X + 10, this.currentY + 35)

      const paidAmount = safeNumber(data.totalPayment - data.totalDebt, 0)
      this.doc.setTextColor(...COLORS.success)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Odenen: ${formatCurrency(paidAmount)}`, card3X + 10, this.currentY + 50)

      this.currentY += cardHeight + 40
    } catch (error) {
      console.error("Error in addSummarySection:", error)
      this.currentY += 140
    }
  }

  private addCreditDetailsSection(data: ReportData) {
    try {
      this.checkPageBreak(100, true)

      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Detaylari", this.margin, this.currentY)
      this.currentY += 35

      data.credits.forEach((credit, index) => {
        this.checkPageBreak(80)

        // Credit card background
        this.doc.setFillColor(...COLORS.white)
        this.doc.setDrawColor(...COLORS.border)
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 70, 5, 5, "FD")

        // Bank name header
        this.doc.setFillColor(...COLORS.primary)
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 5, 5, "F")

        this.doc.setTextColor(...COLORS.white)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(
          `${safeText(credit.bankName)} - ${safeText(credit.creditType)}`,
          this.margin + 10,
          this.currentY + 13,
        )

        // Credit details in two columns
        this.doc.setTextColor(...COLORS.text)
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")

        // Left column
        this.doc.setTextColor(...COLORS.textLight)
        this.doc.text("Kredi Tutari:", this.margin + 10, this.currentY + 35)
        this.doc.setTextColor(...COLORS.text)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(formatCurrency(credit.amount), this.margin + 70, this.currentY + 35)

        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFont("helvetica", "normal")
        this.doc.text("Kalan Borc:", this.margin + 10, this.currentY + 50)
        this.doc.setTextColor(...COLORS.danger)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(formatCurrency(credit.remainingDebt), this.margin + 70, this.currentY + 50)

        // Right column
        const rightColX = this.pageWidth / 2 + 10
        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFont("helvetica", "normal")
        this.doc.text("Faiz Orani:", rightColX, this.currentY + 35)
        this.doc.setTextColor(...COLORS.warning)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(`%${safeNumber(credit.interestRate, 0).toFixed(2)}`, rightColX + 60, this.currentY + 35)

        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFont("helvetica", "normal")
        this.doc.text("Aylik Odeme:", rightColX, this.currentY + 50)
        this.doc.setTextColor(...COLORS.primary)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(formatCurrency(credit.monthlyPayment), rightColX + 60, this.currentY + 50)

        this.currentY += 85
      })
    } catch (error) {
      console.error("Error in addCreditDetailsSection:", error)
      this.currentY += 100
    }
  }

  private addBankDistributionSection(data: ReportData) {
    try {
      this.checkPageBreak(150, true)

      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Banka Dagilimi", this.margin, this.currentY)
      this.currentY += 35

      const bankDistribution = data.credits
        .reduce((acc: any[], credit) => {
          const bankName = safeText(credit.bankName || "Bilinmeyen Banka")
          const existing = acc.find((item) => item.name === bankName)
          if (existing) {
            existing.amount += safeNumber(credit.remainingDebt, 0)
            existing.count += 1
          } else {
            acc.push({
              name: bankName,
              amount: safeNumber(credit.remainingDebt, 0),
              count: 1,
            })
          }
          return acc
        }, [])
        .sort((a, b) => b.amount - a.amount)

      bankDistribution.forEach((bank, index) => {
        this.checkPageBreak(35)

        const percentage = data.totalDebt > 0 ? (bank.amount / data.totalDebt) * 100 : 0
        const barWidth = (percentage / 100) * (this.pageWidth - 2 * this.margin - 100)

        // Bank row background
        this.doc.setFillColor(index % 2 === 0 ? COLORS.white : COLORS.background)
        this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 30, "F")

        // Progress bar background
        this.doc.setFillColor(...COLORS.border)
        this.doc.roundedRect(this.margin + 10, this.currentY + 15, this.pageWidth - 2 * this.margin - 120, 8, 4, 4, "F")

        // Progress bar fill
        if (barWidth > 0) {
          const colors = [COLORS.primary, COLORS.accent, COLORS.warning, COLORS.success, COLORS.danger]
          const color = colors[index % colors.length]
          this.doc.setFillColor(...color)
          this.doc.roundedRect(this.margin + 10, this.currentY + 15, Math.max(barWidth, 5), 8, 4, 4, "F")
        }

        // Bank name and details
        this.doc.setTextColor(...COLORS.text)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(bank.name, this.margin + 10, this.currentY + 10)

        // Amount and percentage
        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(formatCurrency(bank.amount), this.pageWidth - this.margin - 80, this.currentY + 5, {
          align: "right",
        })
        this.doc.text(`%${percentage.toFixed(1)}`, this.pageWidth - this.margin - 80, this.currentY + 18, {
          align: "right",
        })

        this.currentY += 30
      })

      this.currentY += 20
    } catch (error) {
      console.error("Error in addBankDistributionSection:", error)
      this.currentY += 150
    }
  }

  private addCreditTypeDistributionSection(data: ReportData) {
    try {
      this.checkPageBreak(150, true)

      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Turu Dagilimi", this.margin, this.currentY)
      this.currentY += 35

      const typeDistribution = data.credits
        .reduce((acc: any[], credit) => {
          const typeName = safeText(credit.creditType || "Diger")
          const existing = acc.find((item) => item.name === typeName)
          if (existing) {
            existing.amount += safeNumber(credit.remainingDebt, 0)
            existing.count += 1
          } else {
            acc.push({
              name: typeName,
              amount: safeNumber(credit.remainingDebt, 0),
              count: 1,
            })
          }
          return acc
        }, [])
        .sort((a, b) => b.amount - a.amount)

      // Create pie chart representation with modern styling
      typeDistribution.forEach((type, index) => {
        this.checkPageBreak(40)

        const percentage = data.totalDebt > 0 ? (type.amount / data.totalDebt) * 100 : 0

        // Type card
        this.doc.setFillColor(...COLORS.white)
        this.doc.setDrawColor(...COLORS.border)
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 5, 5, "FD")

        // Color indicator
        const colors = [COLORS.primary, COLORS.accent, COLORS.warning, COLORS.success, COLORS.danger]
        const color = colors[index % colors.length]
        this.doc.setFillColor(...color)
        this.doc.roundedRect(this.margin + 10, this.currentY + 10, 15, 15, 3, 3, "F")

        // Type details
        this.doc.setTextColor(...COLORS.text)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(type.name, this.margin + 35, this.currentY + 18)

        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(`${type.count} kredi`, this.margin + 35, this.currentY + 28)

        // Amount and percentage
        this.doc.setTextColor(...COLORS.text)
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(formatCurrency(type.amount), this.pageWidth - this.margin - 80, this.currentY + 15, {
          align: "right",
        })

        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(`%${percentage.toFixed(1)}`, this.pageWidth - this.margin - 80, this.currentY + 28, {
          align: "right",
        })

        this.currentY += 40
      })

      this.currentY += 20
    } catch (error) {
      console.error("Error in addCreditTypeDistributionSection:", error)
      this.currentY += 150
    }
  }

  private addInterestAnalysisSection(data: ReportData) {
    try {
      this.checkPageBreak(180, true)

      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Faiz Analizi", this.margin, this.currentY)
      this.currentY += 35

      const totalInterest = data.credits.reduce((sum, credit) => {
        const monthlyInterest = (safeNumber(credit.remainingDebt, 0) * safeNumber(credit.interestRate, 0)) / 1200
        return sum + monthlyInterest
      }, 0)

      const averageRate =
        data.credits.length > 0
          ? data.credits.reduce((sum, credit) => sum + safeNumber(credit.interestRate, 0), 0) / data.credits.length
          : 0

      const highestRate =
        data.credits.length > 0 ? Math.max(...data.credits.map((credit) => safeNumber(credit.interestRate, 0))) : 0

      const lowestRate =
        data.credits.length > 0 ? Math.min(...data.credits.map((credit) => safeNumber(credit.interestRate, 0))) : 0

      // Interest metrics cards
      const cardWidth = (this.pageWidth - 2 * this.margin - 20) / 2
      const cardHeight = 70

      // Card 1 - Average Rate
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(...COLORS.border)
      this.doc.roundedRect(this.margin, this.currentY, cardWidth, cardHeight, 5, 5, "FD")

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(10)
      this.doc.text("ORTALAMA FAIZ ORANI", this.margin + 10, this.currentY + 15)

      this.doc.setTextColor(...COLORS.warning)
      this.doc.setFontSize(24)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(`%${averageRate.toFixed(2)}`, this.margin + 10, this.currentY + 40)

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`En Yuksek: %${highestRate.toFixed(2)}`, this.margin + 10, this.currentY + 55)
      this.doc.text(`En Dusuk: %${lowestRate.toFixed(2)}`, this.margin + 10, this.currentY + 65)

      // Card 2 - Monthly Interest
      const card2X = this.margin + cardWidth + 10
      this.doc.setFillColor(...COLORS.white)
      this.doc.setDrawColor(...COLORS.border)
      this.doc.roundedRect(card2X, this.currentY, cardWidth, cardHeight, 5, 5, "FD")

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(10)
      this.doc.text("AYLIK TOPLAM FAIZ", card2X + 10, this.currentY + 15)

      this.doc.setTextColor(...COLORS.danger)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(formatCurrency(totalInterest), card2X + 10, this.currentY + 35)

      this.doc.setTextColor(...COLORS.textLight)
      this.doc.setFontSize(9)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Yillik Tahmini:`, card2X + 10, this.currentY + 50)
      this.doc.text(formatCurrency(totalInterest * 12), card2X + 10, this.currentY + 62)

      this.currentY += cardHeight + 30

      // Interest breakdown by credit
      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Bazinda Faiz Dagilimi", this.margin, this.currentY)
      this.currentY += 25

      data.credits.forEach((credit, index) => {
        this.checkPageBreak(25)

        const monthlyInterest = (safeNumber(credit.remainingDebt, 0) * safeNumber(credit.interestRate, 0)) / 1200
        const interestPercentage = totalInterest > 0 ? (monthlyInterest / totalInterest) * 100 : 0

        this.doc.setFillColor(index % 2 === 0 ? COLORS.white : COLORS.background)
        this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - 2 * this.margin, 20, "F")

        this.doc.setTextColor(...COLORS.text)
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(`${safeText(credit.bankName)}`, this.margin + 5, this.currentY + 8)

        this.doc.setTextColor(...COLORS.warning)
        this.doc.text(`%${safeNumber(credit.interestRate, 0).toFixed(2)}`, this.margin + 100, this.currentY + 8)

        this.doc.setTextColor(...COLORS.danger)
        this.doc.text(formatCurrency(monthlyInterest), this.pageWidth - this.margin - 80, this.currentY + 8, {
          align: "right",
        })

        this.doc.setTextColor(...COLORS.textLight)
        this.doc.setFontSize(8)
        this.doc.text(`%${interestPercentage.toFixed(1)}`, this.pageWidth - this.margin - 20, this.currentY + 8, {
          align: "right",
        })

        this.currentY += 20
      })

      this.currentY += 20
    } catch (error) {
      console.error("Error in addInterestAnalysisSection:", error)
      this.currentY += 180
    }
  }

  private addPaymentScheduleTable(data: ReportData) {
    try {
      this.checkPageBreak(200, true)

      this.doc.setTextColor(...COLORS.text)
      this.doc.setFontSize(20)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Odeme Tablosu", this.margin, this.currentY)
      this.currentY += 35

      const headers = ["Tarih", "Odeme", "Faiz", "Anapara", "Kalan Borc"]
      const colWidths = [35, 35, 30, 35, 40]
      const totalWidth = this.pageWidth - 2 * this.margin
      const actualColWidths = colWidths.map((w) => (w / 175) * totalWidth)

      // Generate realistic payment schedule
      const samplePayments = []
      const monthlyPayment = safeNumber(data.monthlyPayment, 2000)
      let remainingDebt = safeNumber(data.totalDebt, 120000)
      const averageRate =
        data.credits.length > 0
          ? data.credits.reduce((sum, credit) => sum + safeNumber(credit.interestRate, 0), 0) /
            data.credits.length /
            100
          : 0.015

      for (let i = 0; i < Math.min(24, Math.ceil(remainingDebt / monthlyPayment)); i++) {
        const paymentDate = new Date()
        paymentDate.setMonth(paymentDate.getMonth() + i + 1)

        const interestPayment = remainingDebt * (averageRate / 12)
        const principalPayment = Math.min(monthlyPayment - interestPayment, remainingDebt)
        remainingDebt = Math.max(0, remainingDebt - principalPayment)

        samplePayments.push([
          format(paymentDate, "dd.MM.yyyy"),
          formatCurrency(monthlyPayment),
          formatCurrency(interestPayment),
          formatCurrency(principalPayment),
          formatCurrency(remainingDebt),
        ])

        if (remainingDebt <= 0) break
      }

      this.addModernTable(headers, samplePayments, actualColWidths)
    } catch (error) {
      console.error("Error in addPaymentScheduleTable:", error)
      this.currentY += 200
    }
  }

  private addModernTable(headers: string[], rows: string[][], colWidths: number[]) {
    try {
      const rowHeight = 25
      const headerHeight = 30

      this.checkPageBreak(headerHeight + rowHeight * Math.min(rows.length, 10))

      // Table header background
      this.doc.setFillColor(...COLORS.primary)
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, headerHeight, 5, 5, "F")

      // Header text
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")

      let currentX = this.margin + 10
      headers.forEach((header, i) => {
        this.doc.text(safeText(header), currentX, this.currentY + 18)
        currentX += colWidths[i]
      })

      this.currentY += headerHeight

      // Table rows
      rows.forEach((row, rowIndex) => {
        this.checkPageBreak(rowHeight + 10)

        // Alternating row colors
        if (rowIndex % 2 === 0) {
          this.doc.setFillColor(...COLORS.background)
          this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, "F")
        }

        // Row border
        this.doc.setDrawColor(...COLORS.border)
        this.doc.setLineWidth(0.3)
        this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight)

        this.doc.setTextColor(...COLORS.text)
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")

        currentX = this.margin + 10
        row.forEach((cell, i) => {
          // Highlight amounts in different colors
          if (i === 1)
            this.doc.setTextColor(...COLORS.primary) // Payment
          else if (i === 2)
            this.doc.setTextColor(...COLORS.warning) // Interest
          else if (i === 3)
            this.doc.setTextColor(...COLORS.success) // Principal
          else if (i === 4)
            this.doc.setTextColor(...COLORS.danger) // Remaining
          else this.doc.setTextColor(...COLORS.text)

          this.doc.text(safeText(cell), currentX, this.currentY + 15)
          currentX += colWidths[i]
        })

        this.currentY += rowHeight
      })

      this.currentY += 30
    } catch (error) {
      console.error("Error in addModernTable:", error)
      this.currentY += 100
    }
  }

  public generateReport(data: ReportData): void {
    try {
      // Main header
      this.addMainHeader(data)

      // Summary section
      this.addSummarySection(data)

      if (data.credits && data.credits.length > 0) {
        // Credit details
        this.addCreditDetailsSection(data)

        // Bank distribution
        this.addBankDistributionSection(data)

        // Credit type distribution
        this.addCreditTypeDistributionSection(data)

        // Interest analysis
        this.addInterestAnalysisSection(data)

        // Payment schedule
        this.addPaymentScheduleTable(data)
      }

      // Add final footer
      this.addPageFooter()

      // Save with Turkish character safe filename
      const filename = `kredi-odemeleri-raporu-${format(new Date(), "yyyy-MM-dd")}.pdf`
      this.doc.save(safeText(filename))
    } catch (error) {
      console.error("Error in generateReport:", error)
      throw new Error("PDF olusturulurken bir hata olustu: " + error.message)
    }
  }
}

export const generatePDFReport = (data: ReportData) => {
  try {
    const generator = new PDFReportGenerator()
    generator.generateReport(data)
  } catch (error) {
    console.error("Error in generatePDFReport:", error)
    throw error
  }
}
