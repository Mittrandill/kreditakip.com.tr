import type { jsPDF } from "jspdf"
import type { PaymentPlan } from "@/lib/types"

interface PaymentPlanData {
  odemePlani: PaymentPlan[]
  krediDetay: {
    credit_code?: string
    banks?: {
      name?: string
    } | null
  } | null
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
    }
  } | null
}

const safeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return ""
  return String(text)
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

const formatMoney = (amount: number): string => {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return safeText(formatted + " TL")
}

const formatDate = (date: Date): string => {
  return safeText(date.toLocaleDateString("tr-TR"))
}

const getStatusBadgeText = (status: string): string => {
  switch (status) {
    case "paid":
      return "Odendi"
    case "pending":
      return "Bekliyor"
    case "overdue":
      return "Gecikti"
    default:
      return status
  }
}

const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath)
    if (!response.ok) {
      throw new Error(`Failed to load image: ${imagePath}`)
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read image: ${imagePath}`))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    throw error
  }
}

const addGradientRect = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  color1: [number, number, number],
  color2: [number, number, number]
) => {
  const steps = 20
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio)
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio)
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(x, y + (height / steps) * i, width, height / steps, "F")
  }
}

const COLORS = {
  primary: [16, 185, 129] as [number, number, number],
  secondary: [20, 184, 166] as [number, number, number],
  accent: [13, 148, 136] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [251, 146, 60] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export async function generatePaymentPlanPDF(data: PaymentPlanData): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()

  const { odemePlani, krediDetay, user } = data

  // Load logos
  let whiteLogo: string | null = null
  let bankLogo: string | null = null

  try {
    whiteLogo = await loadImageAsBase64("/logo-white.png")
  } catch (error) {
    console.log("White logo could not be loaded")
  }

  try {
    const bankLogoUrl = krediDetay?.banks?.logo_url
    console.log("Bank logo URL:", bankLogoUrl)
    if (bankLogoUrl) {
      bankLogo = await loadImageAsBase64(bankLogoUrl)
      console.log("Bank logo loaded successfully")
    }
  } catch (error) {
    console.log("Bank logo could not be loaded:", error)
  }

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // ============ COVER PAGE (Same as pdf-generator) ============
  addGradientRect(doc, 0, 0, pageWidth, pageHeight, COLORS.primary, COLORS.accent)

  // Decorative circles
  doc.setFillColor(255, 255, 255)
  doc.setGState(doc.GState({ opacity: 0.03 }))
  doc.circle(pageWidth * 0.85, pageHeight * 0.15, 60, "F")
  doc.circle(pageWidth * 0.15, pageHeight * 0.85, 50, "F")
  doc.circle(pageWidth * 0.25, pageHeight * 0.4, 35, "F")
  doc.circle(pageWidth * 0.75, pageHeight * 0.6, 40, "F")
  doc.setGState(doc.GState({ opacity: 1 }))

  // Logo section
  const logoY = pageHeight * 0.28
  const logoWidth = 125
  const logoHeight = 25

  

  if (whiteLogo) {
    try {
      doc.addImage(whiteLogo, "PNG", pageWidth / 2 - logoWidth / 2, logoY - logoHeight / 2, logoWidth, logoHeight)
    } catch (error) {
      console.log("Could not add white logo to cover")
      doc.setTextColor(...COLORS.white)
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("Kredi Takip", pageWidth / 2, logoY + 5, { align: "center" })
    }
  } else {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("Kredi Takip", pageWidth / 2, logoY + 5, { align: "center" })
  }

  // Main title
  const titleY = pageHeight * 0.48
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(36)
  doc.setFont("helvetica", "bold")
  doc.text(safeText("ODEME PLANI"), pageWidth / 2, titleY, { align: "center" })
  doc.setFontSize(36)
  doc.text(safeText("RAPORU"), pageWidth / 2, titleY + 22, { align: "center" })

  // Separator line
  doc.setDrawColor(...COLORS.white)
  doc.setLineWidth(0.5)
  doc.setGState(doc.GState({ opacity: 0.5 }))
  const lineWidth = 80
  doc.line(pageWidth / 2 - lineWidth / 2, titleY + 54, pageWidth / 2 + lineWidth / 2, titleY + 54)
  doc.setGState(doc.GState({ opacity: 1 }))

  // Subtitle
  doc.setFontSize(13)
  doc.setFont("helvetica", "normal")
  doc.setGState(doc.GState({ opacity: 0.9 }))
  doc.text(safeText("Taksit ve Odeme Takip Detaylari"), pageWidth / 2, titleY + 66, { align: "center" })
  doc.setGState(doc.GState({ opacity: 1 }))

  // User info and report date (without card background)
  const coverCardY = pageHeight * 0.68

  // User info
  if (user?.email || user?.user_metadata?.full_name) {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(
      safeText(user?.user_metadata?.full_name || user?.email || "Kullanici"),
      pageWidth / 2,
      coverCardY + 22,
      { align: "center" }
    )

    // Divider
    doc.setDrawColor(...COLORS.white)
    doc.setGState(doc.GState({ opacity: 0.3 }))
    doc.line(pageWidth / 2 - 30, coverCardY + 30, pageWidth / 2 + 30, coverCardY + 30)
    doc.setGState(doc.GState({ opacity: 1 }))
  }

  // Report date
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setGState(doc.GState({ opacity: 0.85 }))
  doc.text(safeText("RAPOR TARiHi"), pageWidth / 2, coverCardY + 40, { align: "center" })
  doc.setGState(doc.GState({ opacity: 1 }))

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(formatDate(new Date()), pageWidth / 2, coverCardY + 50, { align: "center" })

  // ============ NEW PAGE - CONTENT ============
  doc.addPage()
  let yPos = 0

  // Header gradient (reduced by 50%)
  addGradientRect(doc, 0, 0, pageWidth, 15, COLORS.primary, COLORS.accent)

  // Bank logo and name on left
  let leftStartX = margin
  if (bankLogo) {
    try {
      const logoSize = 6 // Reduced by 75% from 25
      doc.addImage(bankLogo, "PNG", margin, 2, logoSize, logoSize)
      leftStartX = margin + logoSize + 3
      console.log("Bank logo added to header")
    } catch (error) {
      console.log("Could not add bank logo to header:", error)
    }
  } else {
    console.log("Bank logo is null, not adding to header")
  }

  // Bank name next to logo
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  const bankName = safeText(krediDetay?.banks?.name || "")
  if (bankName) {
    doc.text(bankName, leftStartX, 8)
  }

  // Title below bank info
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Odeme Plani", leftStartX, 13)

  // Date - right aligned
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text(formatDate(new Date()), pageWidth - margin, 10, { align: "right" })

  yPos = 22

  // ============ METRIC CARDS (Matching pdf-generator dimensions) ============
  const totalPrincipal = odemePlani.reduce((sum, p) => sum + p.principal_amount, 0)
  const totalInterest = odemePlani.reduce((sum, p) => sum + p.interest_amount, 0)
  const totalPayment = odemePlani.reduce((sum, p) => sum + p.total_payment, 0)
  const paidCount = odemePlani.filter((p) => p.status === "paid").length

  const cardWidth = (pageWidth - 2 * margin - 30) / 4
  const cardHeight = 17 // Reduced by 60% from 42
  const spacing = 10

  const metrics = [
    { title: "Toplam Taksit", value: `${odemePlani.length}`, subtitle: "Adet", color: COLORS.primary },
    { title: "Odenen", value: `${paidCount}`, subtitle: "Adet", color: COLORS.success },
    { title: "Toplam Ana Para", value: formatMoney(totalPrincipal), subtitle: "", color: COLORS.warning },
    { title: "Toplam Faiz", value: formatMoney(totalInterest), subtitle: "", color: COLORS.danger },
  ]

  metrics.forEach((metric, index) => {
    const x = margin + index * (cardWidth + spacing)

    // Card background
    doc.setFillColor(...COLORS.white)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(x, yPos, cardWidth, cardHeight, "FD")

    // Top colored bar (reduced)
    doc.setFillColor(...metric.color)
    doc.rect(x, yPos, cardWidth, 1.2, "F")

    // Title (matching positions from pdf-generator)
    doc.setFontSize(5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLORS.gray)
    doc.text(safeText(metric.title).toUpperCase(), x + 2, yPos + 6)

    // Value (matching size and position from pdf-generator)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COLORS.dark)
    doc.text(safeText(metric.value), x + 2, yPos + 12)

    // Subtitle if exists
    if (metric.subtitle) {
      doc.setFontSize(4)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...COLORS.gray)
      doc.text(safeText(metric.subtitle), x + 2, yPos + 15)
    }
  })

  yPos += cardHeight + 5 // Adjusted spacing

  // ============ PAYMENT PLAN TABLE (Matching pdf-generator styling) ============
  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 9, 2, 2, "F") // Reduced by 60%
  doc.setFillColor(...COLORS.secondary)
  doc.rect(margin, yPos, 2, 9, "F") // Reduced by 60%
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(7) // Reduced
  doc.setFont("helvetica", "bold")
  doc.text(safeText("TAKSIT DETAYLARI"), margin + 6, yPos + 6) // Adjusted position

  yPos += 11 // Adjusted spacing

  // Table Header (matching pdf-generator)
  const headerHeight = 10 // Reduced by 60% from 25
  doc.setFillColor(...COLORS.secondary)
  doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, "F")

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(7) // Increased by 2 points
  doc.setFont("helvetica", "bold")

  const headers = [
    { text: "No", x: margin + 3 },
    { text: "Vade Tarihi", x: margin + 12 },
    { text: "Ana Para", x: margin + 40 },
    { text: "Faiz", x: margin + 65 },
    { text: "Toplam Odeme", x: margin + 85 },
    { text: "Kalan Borc", x: margin + 115 },
    { text: "Durum", x: margin + 140 },
  ]

  headers.forEach((header) => {
    doc.text(safeText(header.text).toUpperCase(), header.x, yPos + 7) // Adjusted position
  })

  yPos += headerHeight

  // Table Rows (matching pdf-generator row heights)
  const rowHeight = 8 // Reduced by 60% from 20
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7) // Increased by 2 points

  odemePlani.forEach((plan, index) => {
    // Check page break (matching pdf-generator logic)
    if (index > 0 && index % 10 === 0 && yPos + rowHeight > pageHeight - 15) {
      doc.addPage()
      yPos = 12

      // Repeat header on new page
      doc.setFillColor(...COLORS.secondary)
      doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, "F")
      doc.setTextColor(...COLORS.white)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      headers.forEach((header) => {
        doc.text(safeText(header.text).toUpperCase(), header.x, yPos + 7)
      })
      yPos += headerHeight
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, "F")
    }

    // Bottom border
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight)

    // Status color
    const statusColor =
      plan.status === "paid"
        ? COLORS.primary
        : plan.status === "overdue"
          ? COLORS.danger
          : COLORS.gray

    // Row content (adjusted positions for smaller rows)
    doc.setTextColor(...COLORS.dark)
    doc.setFont("helvetica", "normal")
    doc.text(safeText(plan.installment_number), margin + 3, yPos + 5.5) // Adjusted position
    doc.text(safeText(new Date(plan.due_date).toLocaleDateString("tr-TR")), margin + 12, yPos + 5.5)
    doc.text(formatMoney(plan.principal_amount), margin + 40, yPos + 5.5)
    doc.text(formatMoney(plan.interest_amount), margin + 65, yPos + 5.5)
    doc.text(formatMoney(plan.total_payment), margin + 85, yPos + 5.5)
    doc.text(formatMoney(plan.remaining_debt), margin + 115, yPos + 5.5)

    doc.setTextColor(...statusColor)
    doc.setFont("helvetica", "bold")
    doc.text(safeText(getStatusBadgeText(plan.status)), margin + 140, yPos + 5.5)

    yPos += rowHeight
  })

  // ============ MODERN FOOTER ON ALL PAGES (Matching pdf-generator) ============
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    addGradientRect(doc, 0, pageHeight - 8, pageWidth, 8, COLORS.primary, COLORS.accent)

    doc.setTextColor(...COLORS.white)
    doc.setFontSize(8)

    // Left - Website
    doc.setFont("helvetica", "bold")
    doc.text("kreditakip.com.tr", margin, pageHeight - 3)

    // Center - Tagline
    doc.setFont("helvetica", "normal")
    doc.text("Finansal ozgurluge giden yol", pageWidth / 2, pageHeight - 3, { align: "center" })

    // Right - Page number
    doc.setFont("helvetica", "bold")
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 3, { align: "right" })
  }

  doc.save(`odeme-plani-${krediDetay?.credit_code}.pdf`)
}