import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import type { RiskAnalysis, RiskAnalysisData } from "@/lib/types"

// Modern color palette
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

// Turkish character converter
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

class FinancialHealthPDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private analysis: RiskAnalysis
  private analysisData: RiskAnalysisData
  private pageNumber = 1

  constructor(doc: jsPDF, analysis: RiskAnalysis, analysisData: RiskAnalysisData) {
    this.doc = doc
    this.pageWidth = doc.internal.pageSize.getWidth()
    this.pageHeight = doc.internal.pageSize.getHeight()
    this.margin = 15
    this.currentY = this.margin
    this.analysis = analysis
    this.analysisData = analysisData
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

  private async addCoverPage() {
    // Gradient background
    const riskColor = this.analysisData.overallRiskScore?.color
    let bgStartColor = COLORS.primary
    let bgEndColor = COLORS.accent

    if (riskColor === "yellow") {
      bgStartColor = [251, 191, 36] as [number, number, number] // Yellow
      bgEndColor = [245, 158, 11] as [number, number, number] // Amber
    } else if (riskColor === "red") {
      bgStartColor = [239, 68, 68] as [number, number, number] // Red
      bgEndColor = [220, 38, 38] as [number, number, number] // Dark Red
    }

    this.addGradientRect(0, 0, this.pageWidth, this.pageHeight, bgStartColor, bgEndColor)

    // Decorative circles
    this.doc.setFillColor(255, 255, 255)
    this.doc.setGState(this.doc.GState({ opacity: 0.03 }))
    this.doc.circle(this.pageWidth * 0.85, this.pageHeight * 0.15, 60, "F")
    this.doc.circle(this.pageWidth * 0.15, this.pageHeight * 0.85, 50, "F")
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Logo section
    const logoY = this.pageHeight * 0.25
    try {
      const logoResponse = await fetch('/logo-white.png')
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob()
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(logoBlob)
        })
        this.doc.addImage(logoBase64, "PNG", this.pageWidth / 2 - 85, logoY - 17, 170, 33)
      }
    } catch (error) {
    }

    // Main title
    const titleY = this.pageHeight * 0.42
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(32)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText("AI FINANSAL SAGLIK"), this.pageWidth / 2, titleY, { align: "center" })
    this.doc.text(safeText("OZETI RAPORU"), this.pageWidth / 2, titleY + 36, { align: "center" })

    // Separator line
    this.doc.setDrawColor(...COLORS.white)
    this.doc.setLineWidth(0.5)
    this.doc.setGState(this.doc.GState({ opacity: 0.5 }))
    this.doc.line(this.pageWidth / 2 - 40, titleY + 46, this.pageWidth / 2 + 40, titleY + 46)
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Risk score card
    const cardY = this.pageHeight * 0.58
    const cardWidth = 160
    const cardHeight = 80

    // Card shadow
    this.doc.setFillColor(0, 0, 0)
    this.doc.setGState(this.doc.GState({ opacity: 0.15 }))
    this.doc.roundedRect(this.pageWidth / 2 - cardWidth / 2 + 2, cardY + 2, cardWidth, cardHeight, 8, 8, "F")

    // Card background
    this.doc.setGState(this.doc.GState({ opacity: 0.15 }))
    this.doc.setFillColor(255, 255, 255)
    this.doc.roundedRect(this.pageWidth / 2 - cardWidth / 2, cardY, cardWidth, cardHeight, 8, 8, "F")
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Risk score
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(48)
    this.doc.setFont("helvetica", "bold")
    const riskScore = this.analysisData.overallRiskScore?.numericScore || 0
    this.doc.text(`${riskScore}`, this.pageWidth / 2, cardY + 38, { align: "center" })

    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(safeText("Risk Skoru"), this.pageWidth / 2, cardY + 52, { align: "center" })

    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    const riskLabel = this.analysisData.overallRiskScore?.value || "Bilinmiyor"
    this.doc.text(safeText(riskLabel), this.pageWidth / 2, cardY + 68, { align: "center" })

    // Date info
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.setGState(this.doc.GState({ opacity: 0.9 }))
    this.doc.text(safeText(formatDate(new Date(this.analysis.created_at))), this.pageWidth / 2, this.pageHeight - 30, { align: "center" })
    this.doc.setGState(this.doc.GState({ opacity: 1 }))

    // Start new page after cover
    this.doc.addPage()
    this.pageNumber++
    this.currentY = 15
  }

  private addModernSection(title: string, color: keyof typeof COLORS = "primary") {
    this.checkPageBreak(30)

    this.addGradientRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, COLORS.lightGray, COLORS.white)
    this.doc.setFillColor(...COLORS[color])
    this.doc.rect(this.margin, this.currentY, 4, 20, "F")

    this.doc.setTextColor(...COLORS.dark)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(safeText(title.toUpperCase()), this.margin + 10, this.currentY + 13)

    this.currentY += 24
  }

  private addTextBlock(text: string, fontSize = 9, indent = 8) {
    if (!text || text.trim() === "") return

    this.doc.setFontSize(fontSize)
    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(...COLORS.dark)

    const maxWidth = this.pageWidth - 2 * this.margin - indent - 8
    const lines = this.doc.splitTextToSize(safeText(text), maxWidth)

    lines.forEach((line: string) => {
      this.checkPageBreak(10)
      this.doc.text(line, this.margin + indent, this.currentY)
      this.currentY += 10
    })

    this.currentY += 6
  }

  private addMetricCard(label: string, value: string, color: keyof typeof COLORS = "primary") {
    const cardWidth = (this.pageWidth - 2 * this.margin - 20) / 3
    const cardHeight = 40

    this.doc.setFillColor(...COLORS.white)
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.5)
    this.doc.rect(this.margin, this.currentY, cardWidth, cardHeight, "FD")

    this.doc.setFillColor(...COLORS[color])
    this.doc.rect(this.margin, this.currentY, cardWidth, 3, "F")

    this.doc.setFontSize(7)
    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(...COLORS.gray)
    this.doc.text(safeText(label).toUpperCase(), this.margin + 4, this.currentY + 13)

    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(...COLORS.dark)
    const lines = this.doc.splitTextToSize(safeText(value), cardWidth - 8)
    this.doc.text(lines[0] || "", this.margin + 4, this.currentY + 27)
  }

  private async addSummaryPage() {
    // Add section header with proper spacing
    this.currentY += 5

    const headerY = this.currentY
    this.addGradientRect(this.margin, headerY, this.pageWidth - 2 * this.margin, 35, COLORS.primary, COLORS.secondary)

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("GENEL BAKIS VE OZET", this.pageWidth / 2, headerY + 22, { align: "center" })

    this.currentY = headerY + 45

    // Overall risk summary
    this.addModernSection("Genel Risk Ozeti", "info")
    this.addTextBlock(this.analysisData.overallRiskSummary || "Genel ozet bulunmamaktadir.")

    // DTI Ratio
    if (this.analysisData.debtToIncomeRatio) {
      this.addModernSection("Borc/Gelir Orani (DTI)", "warning")
      this.addTextBlock(
        `Oran: ${this.analysisData.debtToIncomeRatio.value}\nDegerlendirme: ${this.analysisData.debtToIncomeRatio.assessment}\n\n${this.analysisData.debtToIncomeRatio.explanation}`
      )
    }

    // Cash Flow
    if (this.analysisData.cashFlowAnalysis) {
      this.addModernSection("Nakit Akis Analizi", "success")
      const cf = this.analysisData.cashFlowAnalysis
      this.addTextBlock(
        `Aylik Gelir: ${formatCurrency(cf.monthlyIncome || 0)}\nAylik Giderler: ${formatCurrency(cf.monthlyExpenses || 0)}\nKullanilabilir Gelir: ${formatCurrency(cf.disposableIncome || 0)}\n\nDegerlendirme: ${cf.assessment}\n\n${cf.explanation}`
      )
    }
  }

  private async addFactorsPage() {
    this.checkPageBreak(80)
    this.currentY += 5

    // Add section header
    const headerY = this.currentY
    this.addGradientRect(this.margin, headerY, this.pageWidth - 2 * this.margin, 35, COLORS.danger, [220, 38, 38])

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RISK VE POZITIF FAKTORLER", this.pageWidth / 2, headerY + 22, { align: "center" })

    this.currentY = headerY + 45

    // Risk Factors
    this.addModernSection("Temel Risk Faktorleri", "danger")
    if (this.analysisData.keyRiskFactors && this.analysisData.keyRiskFactors.length > 0) {
      this.analysisData.keyRiskFactors.forEach((factor, index) => {
        const detailText = safeText(factor.detailedExplanation || factor.impact)
        const detailLines = this.doc.splitTextToSize(detailText, this.pageWidth - 2 * this.margin - 20)
        const cardHeight = Math.min(45 + detailLines.length * 8, 70)

        this.checkPageBreak(cardHeight + 10)

        // Factor card
        const cardY = this.currentY

        this.doc.setFillColor(254, 242, 242)
        this.doc.rect(this.margin, cardY, this.pageWidth - 2 * this.margin, cardHeight, "F")

        this.doc.setFillColor(...COLORS.danger)
        this.doc.rect(this.margin, cardY, 3, cardHeight, "F")

        this.doc.setFontSize(9)
        this.doc.setFont("helvetica", "bold")
        this.doc.setTextColor(...COLORS.dark)
        const titleLines = this.doc.splitTextToSize(`${index + 1}. ${safeText(factor.factor)}`, this.pageWidth - 2 * this.margin - 20)
        this.doc.text(titleLines[0] || "", this.margin + 10, cardY + 12)

        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        let textY = cardY + 24
        detailLines.slice(0, 4).forEach((line: string) => {
          this.doc.text(line, this.margin + 10, textY)
          textY += 9
        })

        this.currentY = cardY + cardHeight + 6
      })
    } else {
      this.addTextBlock("Belirlenen onemli bir risk faktoru bulunmamaktadir.")
    }

    // Positive Factors
    this.currentY += 8
    this.addModernSection("Pozitif Faktorler", "success")
    if (this.analysisData.positiveFactors && this.analysisData.positiveFactors.length > 0) {
      this.analysisData.positiveFactors.forEach((factor, index) => {
        const detailText = safeText(factor.detailedExplanation || factor.benefit)
        const detailLines = this.doc.splitTextToSize(detailText, this.pageWidth - 2 * this.margin - 20)
        const cardHeight = Math.min(45 + detailLines.length * 8, 70)

        this.checkPageBreak(cardHeight + 10)

        const cardY = this.currentY

        this.doc.setFillColor(240, 253, 244)
        this.doc.rect(this.margin, cardY, this.pageWidth - 2 * this.margin, cardHeight, "F")

        this.doc.setFillColor(...COLORS.success)
        this.doc.rect(this.margin, cardY, 3, cardHeight, "F")

        this.doc.setFontSize(9)
        this.doc.setFont("helvetica", "bold")
        this.doc.setTextColor(...COLORS.dark)
        const titleLines = this.doc.splitTextToSize(`${index + 1}. ${safeText(factor.factor)}`, this.pageWidth - 2 * this.margin - 20)
        this.doc.text(titleLines[0] || "", this.margin + 10, cardY + 12)

        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        let textY = cardY + 24
        detailLines.slice(0, 4).forEach((line: string) => {
          this.doc.text(line, this.margin + 10, textY)
          textY += 9
        })

        this.currentY = cardY + cardHeight + 6
      })
    } else {
      this.addTextBlock("Belirlenen onemli bir pozitif faktor bulunmamaktadir.")
    }
  }

  private async addRecommendationsPage() {
    this.checkPageBreak(80)
    this.currentY += 5

    // Add section header
    const headerY = this.currentY
    this.addGradientRect(this.margin, headerY, this.pageWidth - 2 * this.margin, 35, [251, 191, 36], [245, 158, 11])

    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(13)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("ONERILER VE EYLEM PLANI", this.pageWidth / 2, headerY + 22, { align: "center" })

    this.currentY = headerY + 45

    this.addModernSection("Oneriler", "warning")

    if (this.analysisData.recommendations && this.analysisData.recommendations.length > 0) {
      this.analysisData.recommendations.forEach((rec, index) => {
        const detailText = safeText(rec.details)
        const detailLines = this.doc.splitTextToSize(detailText, this.pageWidth - 2 * this.margin - 20)
        const cardHeight = Math.min(48 + detailLines.length * 8, 75)

        this.checkPageBreak(cardHeight + 10)

        const cardY = this.currentY

        this.doc.setFillColor(254, 252, 232)
        this.doc.rect(this.margin, cardY, this.pageWidth - 2 * this.margin, cardHeight, "F")

        this.doc.setFillColor(...COLORS.warning)
        this.doc.rect(this.margin, cardY, 3, cardHeight, "F")

        // Priority badge
        const priorityColors: Record<string, [number, number, number]> = {
          "Yuksek": COLORS.danger,
          "Orta": COLORS.warning,
          "Dusuk": COLORS.success
        }
        const badgeColor = priorityColors[rec.priority] || COLORS.gray
        this.doc.setFillColor(...badgeColor)
        this.doc.roundedRect(this.pageWidth - this.margin - 32, cardY + 6, 27, 9, 2, 2, "F")
        this.doc.setTextColor(...COLORS.white)
        this.doc.setFontSize(7)
        this.doc.setFont("helvetica", "bold")
        this.doc.text(safeText(rec.priority).toUpperCase(), this.pageWidth - this.margin - 18.5, cardY + 12.5, { align: "center" })

        this.doc.setFontSize(9)
        this.doc.setFont("helvetica", "bold")
        this.doc.setTextColor(...COLORS.dark)
        const titleLines = this.doc.splitTextToSize(`${index + 1}. ${safeText(rec.recommendation)}`, this.pageWidth - 2 * this.margin - 45)
        this.doc.text(titleLines[0] || "", this.margin + 10, cardY + 13)

        this.doc.setFontSize(8)
        this.doc.setFont("helvetica", "normal")
        this.doc.setTextColor(...COLORS.gray)
        let textY = cardY + 25
        detailLines.slice(0, 4).forEach((line: string) => {
          this.doc.text(line, this.margin + 10, textY)
          textY += 9
        })

        this.currentY = cardY + cardHeight + 6
      })
    } else {
      this.addTextBlock("Su anda ozel bir oneri bulunmamaktadir.")
    }
  }

  private addModernFooter() {
    // @ts-ignore
    const pageCount = this.doc.internal.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      this.addGradientRect(0, this.pageHeight - 20, this.pageWidth, 20, COLORS.primary, COLORS.accent)

      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(7)

      this.doc.setFont("helvetica", "bold")
      this.doc.text("kreditakip.com.tr", this.margin, this.pageHeight - 8)

      this.doc.setFont("helvetica", "normal")
      this.doc.text("AI Finansal Saglik Ozeti", this.pageWidth / 2, this.pageHeight - 8, { align: "center" })

      this.doc.setFont("helvetica", "bold")
      this.doc.text(`${i} / ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 8, { align: "right" })
    }
  }

  private checkPageBreak(height: number) {
    const footerSpace = 30
    if (this.currentY + height > this.pageHeight - footerSpace) {
      this.doc.addPage()
      this.pageNumber++
      this.currentY = 15
    }
  }

  private addPage() {
    this.doc.addPage()
    this.pageNumber++
    this.currentY = 15
  }

  public async generate() {
    try {
      await this.addCoverPage()
      await this.addSummaryPage()
      await this.addFactorsPage()
      await this.addRecommendationsPage()

      // Outlook page if data exists
      if (this.analysisData.futureOutlook) {
        this.checkPageBreak(80)
        this.currentY += 5

        // Add section header
        const headerY = this.currentY
        this.addGradientRect(this.margin, headerY, this.pageWidth - 2 * this.margin, 35, [168, 85, 247], [147, 51, 234])

        this.doc.setTextColor(...COLORS.white)
        this.doc.setFontSize(13)
        this.doc.setFont("helvetica", "bold")
        this.doc.text("GELECEK PERSPEKTIFI", this.pageWidth / 2, headerY + 22, { align: "center" })

        this.currentY = headerY + 45

        this.addModernSection("Kisa Vadeli Gorunum (6-12 Ay)", "info")
        this.addTextBlock(this.analysisData.futureOutlook.shortTerm)

        this.addModernSection("Uzun Vadeli Gorunum (1-5 Yil)", "primary")
        this.addTextBlock(this.analysisData.futureOutlook.longTerm)

        if (this.analysisData.futureOutlook.opportunities && this.analysisData.futureOutlook.opportunities.length > 0) {
          this.addModernSection("Firsatlar", "success")
          this.analysisData.futureOutlook.opportunities.forEach((opp, i) => {
            this.checkPageBreak(20)
            this.addTextBlock(`${i + 1}. ${opp}`, 8)
          })
        }
      }

      this.addModernFooter()
    } catch (error) {
      console.error("PDF olusturma hatasi:", error)
      throw error
    }
  }
}

export async function generateFinancialHealthPDF(analysis: RiskAnalysis, analysisData: RiskAnalysisData): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    })

    const generator = new FinancialHealthPDFGenerator(doc, analysis, analysisData)
    await generator.generate()

    const timestamp = format(new Date(analysis.created_at), "yyyy-MM-dd_HH-mm", { locale: tr })
    const filename = `finansal-saglik-analizi-${timestamp}.pdf`

    doc.save(filename)
  } catch (error) {
    console.error("PDF olusturma hatasi:", error)
    throw error
  }
}
