import jsPDF from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

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

const getBankColor = (bankName: string): [number, number, number] => {
  const colors: [number, number, number][] = [
    [16, 185, 129], // Emerald
    [59, 130, 246], // Blue
    [147, 51, 234], // Purple
    [245, 158, 11], // Amber
    [239, 68, 68], // Red
    [34, 197, 94], // Green
    [14, 165, 233], // Sky
    [234, 179, 8], // Yellow
    [217, 70, 239], // Fuchsia
    [20, 184, 166], // Teal
  ]

  let hash = 0
  for (let i = 0; i < bankName.length; i++) {
    const char = bankName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return colors[Math.abs(hash) % colors.length]
}

const getBankInitials = (bankName: string): string => {
  return bankName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
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
    this.margin = 20
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
    const footerSpace = 40
    const availableSpace = this.pageHeight - this.currentY - footerSpace

    if (forceBreak || requiredHeight > availableSpace || availableSpace < 80) {
      this.addPage()
      return true
    }
    return false
  }

  private addPageHeader() {
    try {
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(`Sayfa ${this.pageNumber}`, this.pageWidth - this.margin, this.margin, { align: "right" })

      // Simple line under header
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setLineWidth(0.3)
      this.doc.line(this.margin, this.margin + 10, this.pageWidth - this.margin, this.margin + 10)

      this.currentY = this.margin + 25
    } catch (error) {
      console.error("Error in addPageHeader:", error)
      this.currentY = this.margin + 25
    }
  }

  private addMainHeader(data: ReportData) {
    try {
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(28)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Odemeleri", this.margin, this.currentY + 20)

      this.doc.setFontSize(28)
      this.doc.setFont("helvetica", "normal")
      this.doc.text("Raporu", this.margin, this.currentY + 45)

      // Date on the right
      this.doc.setFontSize(16)
      this.doc.setFont("helvetica", "normal")
      const currentDate = format(new Date(), "dd MMMM yyyy", { locale: tr })
      this.doc.text(safeText(currentDate), this.pageWidth - this.margin, this.currentY + 30, { align: "right" })

      this.currentY += 70
    } catch (error) {
      console.error("Error in addMainHeader:", error)
      this.currentY += 70
    }
  }

  private addSummarySection(data: ReportData) {
    try {
      this.checkPageBreak(120)

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Ozet", this.margin, this.currentY)
      this.currentY += 25

      // Horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

      const leftColumnX = this.margin
      const rightColumnX = this.pageWidth / 2 + 20

      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "normal")

      // Left column - amounts
      const totalAmount = safeNumber(data.totalPayment, 0)
      const remainingDebt = safeNumber(data.totalDebt, 0)
      const paidAmount = totalAmount - remainingDebt

      this.doc.text(formatCurrency(totalAmount).replace(" TL", ""), leftColumnX, this.currentY)
      this.doc.text(formatCurrency(remainingDebt * 4).replace(" TL", ""), leftColumnX + 80, this.currentY)
      this.doc.text("Odenen", rightColumnX, this.currentY)
      this.doc.text(`${formatCurrency(paidAmount).replace(" TL", "")} TL`, rightColumnX + 80, this.currentY)
      this.currentY += 20

      this.doc.text("Kalan", leftColumnX, this.currentY)
      this.doc.text(formatCurrency(remainingDebt).replace(" TL", ""), leftColumnX + 80, this.currentY)
      this.doc.text("Aylik Odeme", rightColumnX, this.currentY)
      this.doc.text(`${formatCurrency(data.monthlyPayment).replace(" TL", "")} TL`, rightColumnX + 80, this.currentY)
      this.currentY += 40
    } catch (error) {
      console.error("Error in addSummarySection:", error)
      this.currentY += 120
    }
  }

  private addCreditDetailsSection(data: ReportData) {
    try {
      this.checkPageBreak(100, true)

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Detaylari", this.margin, this.currentY)
      this.currentY += 25

      // Horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

      data.credits.forEach((credit, index) => {
        if (index > 0) this.currentY += 15

        this.checkPageBreak(60)

        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(`Kredi Tutari`, this.margin, this.currentY)
        this.doc.text(`${formatCurrency(credit.amount).replace(" TL", "")} TL`, this.margin + 80, this.currentY)
        this.doc.text(`Faiz Orani`, this.pageWidth / 2, this.currentY)
        this.doc.text(`${safeNumber(credit.interestRate, 0).toFixed(2)}%`, this.pageWidth / 2 + 80, this.currentY)
        this.currentY += 15

        this.doc.setFont("helvetica", "normal")
        this.doc.text(`Baslangic Tarihi`, this.margin, this.currentY)
        this.doc.text(`01.01.2023`, this.margin + 80, this.currentY)
        this.doc.text(`Vade`, this.pageWidth / 2, this.currentY)
        this.doc.text(`60 ay`, this.pageWidth / 2 + 80, this.currentY)
        this.currentY += 25
      })
    } catch (error) {
      console.error("Error in addCreditDetailsSection:", error)
      this.currentY += 100
    }
  }

  private addBankDistributionSection(data: ReportData) {
    try {
      this.checkPageBreak(150, true)

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Banka Dagilimi", this.margin, this.currentY)
      this.currentY += 25

      // Horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

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

      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "normal")

      bankDistribution.forEach((bank, index) => {
        this.checkPageBreak(20)

        const percentage = data.totalDebt > 0 ? ((bank.amount / data.totalDebt) * 100).toFixed(1) : "0.0"

        this.doc.text(`${bank.name}`, this.margin, this.currentY)
        this.doc.text(`${formatCurrency(bank.amount).replace(" TL", "")} TL`, this.margin + 100, this.currentY)
        this.doc.text(`%${percentage}`, this.pageWidth - this.margin - 40, this.currentY)
        this.currentY += 18
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

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Kredi Turu Dagilimi", this.margin, this.currentY)
      this.currentY += 25

      // Horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

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

      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "normal")

      typeDistribution.forEach((type, index) => {
        this.checkPageBreak(20)

        const percentage = data.totalDebt > 0 ? ((type.amount / data.totalDebt) * 100).toFixed(1) : "0.0"

        this.doc.text(`${type.name}`, this.margin, this.currentY)
        this.doc.text(`${formatCurrency(type.amount).replace(" TL", "")} TL`, this.margin + 100, this.currentY)
        this.doc.text(`%${percentage}`, this.pageWidth - this.margin - 40, this.currentY)
        this.currentY += 18
      })

      this.currentY += 20
    } catch (error) {
      console.error("Error in addCreditTypeDistributionSection:", error)
      this.currentY += 150
    }
  }

  private addInterestAnalysisSection(data: ReportData) {
    try {
      this.checkPageBreak(150, true)

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Faiz Analizi", this.margin, this.currentY)
      this.currentY += 25

      // Horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

      const totalInterest = data.credits.reduce((sum, credit) => {
        const monthlyInterest = (safeNumber(credit.remainingDebt, 0) * safeNumber(credit.interestRate, 0)) / 1200
        return sum + monthlyInterest
      }, 0)

      const averageRate =
        data.credits.length > 0
          ? data.credits.reduce((sum, credit) => sum + safeNumber(credit.interestRate, 0), 0) / data.credits.length
          : 0

      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "normal")

      this.doc.text(`Ortalama Faiz Orani`, this.margin, this.currentY)
      this.doc.text(`%${averageRate.toFixed(2)}`, this.margin + 100, this.currentY)
      this.currentY += 18

      this.doc.text(`Aylik Toplam Faiz`, this.margin, this.currentY)
      this.doc.text(`${formatCurrency(totalInterest).replace(" TL", "")} TL`, this.margin + 100, this.currentY)
      this.currentY += 18

      this.doc.text(`Yillik Tahmini Faiz`, this.margin, this.currentY)
      this.doc.text(`${formatCurrency(totalInterest * 12).replace(" TL", "")} TL`, this.margin + 100, this.currentY)
      this.currentY += 30
    } catch (error) {
      console.error("Error in addInterestAnalysisSection:", error)
      this.currentY += 150
    }
  }

  private addPaymentScheduleTable(data: ReportData) {
    try {
      this.checkPageBreak(200, true)

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(18)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Odeme Tablosu", this.margin, this.currentY)
      this.currentY += 25

      // Horizontal line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 20

      const headers = ["Tarih", "Odeme", "Faiz", "Anapara", "Kalan Borc"]

      const samplePayments = []
      const monthlyPayment = safeNumber(data.monthlyPayment, 2000)
      let remainingDebt = safeNumber(data.totalDebt, 120000)
      const averageRate =
        data.credits.length > 0
          ? data.credits.reduce((sum, credit) => sum + safeNumber(credit.interestRate, 0), 0) /
            data.credits.length /
            100
          : 0.015

      for (let i = 0; i < Math.min(12, Math.ceil(remainingDebt / monthlyPayment)); i++) {
        const paymentDate = new Date()
        paymentDate.setMonth(paymentDate.getMonth() + i + 1)

        const interestPayment = remainingDebt * (averageRate / 12)
        const principalPayment = Math.min(monthlyPayment - interestPayment, remainingDebt)
        remainingDebt = Math.max(0, remainingDebt - principalPayment)

        samplePayments.push([
          format(paymentDate, "dd.MM.yyyy"),
          `${formatCurrency(monthlyPayment).replace(" TL", "")} TL`,
          formatCurrency(interestPayment).replace(" TL", ""),
          formatCurrency(principalPayment).replace(" TL", ""),
          formatCurrency(remainingDebt).replace(" TL", ""),
        ])

        if (remainingDebt <= 0) break
      }

      this.addTable(headers, samplePayments)
    } catch (error) {
      console.error("Error in addPaymentScheduleTable:", error)
      this.currentY += 200
    }
  }

  private addTable(headers: string[], rows: string[][]) {
    try {
      const colWidth = safeNumber((this.pageWidth - 2 * this.margin) / headers.length, 25)
      const rowHeight = 18

      this.checkPageBreak(rowHeight * (rows.length + 3))

      this.doc.setTextColor(0, 0, 0)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")

      headers.forEach((header, i) => {
        const x = safeCoordinate(this.margin + i * colWidth, this.margin, this.pageWidth)
        this.doc.text(safeText(header), x, this.currentY + 12)
      })

      this.currentY += rowHeight

      // Header line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)

      rows.forEach((row, rowIndex) => {
        this.checkPageBreak(rowHeight + 20)

        this.doc.setTextColor(0, 0, 0)
        this.doc.setFontSize(11)
        this.doc.setFont("helvetica", "normal")

        row.forEach((cell, i) => {
          const x = safeCoordinate(this.margin + i * colWidth, this.margin, this.pageWidth)
          this.doc.text(safeText(cell), x, this.currentY + 12)
        })

        this.currentY += rowHeight
      })

      this.currentY += 20
    } catch (error) {
      console.error("Error in addTable:", error)
      this.currentY += 100
    }
  }

  public generateReport(data: ReportData): void {
    try {
      this.addMainHeader(data)
      this.addSummarySection(data)

      if (data.credits && data.credits.length > 0) {
        this.addCreditDetailsSection(data)
        this.addBankDistributionSection(data)
        this.addCreditTypeDistributionSection(data)
        this.addInterestAnalysisSection(data)
        this.addPaymentScheduleTable(data)
      }

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

const COLORS = {
  primary: [16, 185, 129],
  secondary: [59, 130, 246],
  accent: [245, 158, 11],
  danger: [239, 68, 68],
  dark: [30, 41, 59],
  gray: [107, 114, 128],
  light: [248, 250, 252],
  white: [255, 255, 255],
}
