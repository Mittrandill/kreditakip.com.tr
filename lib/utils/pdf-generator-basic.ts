import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, "dd/MM/yyyy", { locale: tr })
  } catch {
    return "-"
  }
}

// Main PDF generation function
export const generatePDFReport = (reportData: any) => {
  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let currentY = 30
  
  // Title
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("Finansal Durum Raporu", margin, currentY)
  currentY += 15
  
  // Date
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Rapor Tarihi: ${formatDate(new Date())}`, margin, currentY)
  currentY += 20
  
  // Summary Section
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Genel Ozet", margin, currentY)
  currentY += 10
  
  // Draw a line
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 10
  
  // Summary metrics
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  
  const summaryItems = [
    `Toplam Borc: ${formatCurrency(reportData.totalDebt || 0)}`,
    `Aylik Odeme: ${formatCurrency(reportData.monthlyPayment || 0)}`,
    `Aktif Kredi Sayisi: ${reportData.activeCredits || 0}`,
    `Toplam Kredi Sayisi: ${reportData.totalCredits || 0}`
  ]
  
  summaryItems.forEach((item, index) => {
    doc.text(item, margin, currentY + (index * 8))
  })
  
  currentY += summaryItems.length * 8 + 20
  
  // Credits Section
  if (reportData.credits && reportData.credits.length > 0) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Kredi Detaylari", margin, currentY)
    currentY += 10
    
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 15
    
    // Credits table header
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Banka", margin, currentY)
    doc.text("Kredi Turu", margin + 40, currentY)
    doc.text("Kalan Borc", margin + 80, currentY)
    doc.text("Aylik Odeme", margin + 120, currentY)
    doc.text("Faiz", margin + 160, currentY)
    currentY += 8
    
    // Credits table data
    doc.setFont("helvetica", "normal")
    reportData.credits.slice(0, 15).forEach((credit: any, index: number) => {
      const y = currentY + (index * 8)
      
      // Check if we need a new page
      if (y > pageHeight - 50) {
        doc.addPage()
        currentY = 30
        return
      }
      
      doc.text((credit.bankName || "N/A").substring(0, 15), margin, y)
      doc.text((credit.creditType || "N/A").substring(0, 15), margin + 40, y)
      doc.text(formatCurrency(credit.remainingDebt || 0), margin + 80, y)
      doc.text(formatCurrency(credit.monthlyPayment || 0), margin + 120, y)
      doc.text(`%${(credit.interestRate || 0).toFixed(1)}`, margin + 160, y)
    })
    
    currentY += Math.min(reportData.credits.length, 15) * 8 + 20
  }
  
  // Check if we need a new page for payments
  if (currentY > pageHeight - 100) {
    doc.addPage()
    currentY = 30
  }
  
  // Payments Section
  if (reportData.payments && reportData.payments.length > 0) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Odeme Gecmisi", margin, currentY)
    currentY += 10
    
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 15
    
    // Payments table header
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Tarih", margin, currentY)
    doc.text("Banka", margin + 40, currentY)
    doc.text("Tutar", margin + 90, currentY)
    doc.text("Durum", margin + 130, currentY)
    currentY += 8
    
    // Payments table data
    doc.setFont("helvetica", "normal")
    reportData.payments.slice(0, 20).forEach((payment: any, index: number) => {
      const y = currentY + (index * 8)
      
      // Check if we need a new page
      if (y > pageHeight - 50) {
        doc.addPage()
        currentY = 30
        return
      }
      
      doc.text(formatDate(payment.date), margin, y)
      doc.text((payment.bankName || "N/A").substring(0, 20), margin + 40, y)
      doc.text(formatCurrency(payment.amount || 0), margin + 90, y)
      
      const status = payment.status === "paid" ? "Odendi" : 
                    payment.status === "pending" ? "Beklemede" : "Gecikmis"
      doc.text(status, margin + 130, y)
    })
    
    currentY += Math.min(reportData.payments.length, 20) * 8 + 20
  }
  
  // Check if we need a new page for recommendations
  if (currentY > pageHeight - 120) {
    doc.addPage()
    currentY = 30
  }
  
  // Recommendations Section
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Oneriler", margin, currentY)
  currentY += 10
  
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 15
  
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  
  const recommendations = [
    "• Kredi karti borcunuzu minimize ederek faiz odemelerini azaltin",
    "• Aylik odemelerinizi zamaninda yaparak kredi puaninizi iyilestirin",
    "• Yuksek faizli kredileri oncelikli olarak kapatmayi hedefleyin",
    "• Acil durum fonu olusturarak beklenmedik harcamalara hazirlikli olun",
    "• Kredi kullanim oraninizi %30'un altinda tutmaya calisin",
    "• Duzenli butce takibi yaparak harcamalarinizi kontrol altinda tutun"
  ]
  
  recommendations.forEach((rec, index) => {
    const lines = doc.splitTextToSize(rec, pageWidth - (margin * 2))
    doc.text(lines, margin, currentY + (index * 10))
  })
  
  currentY += recommendations.length * 10 + 20
  
  // Footer
  const footerY = pageHeight - 20
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("KrediTakip AI ile olusturuldu", margin, footerY)
  doc.text(`Olusturulma: ${format(new Date(), "dd.MM.yyyy HH:mm")}`, pageWidth - margin, footerY, { align: "right" })
  
  // Save the PDF
  const fileName = `kredi-raporu-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
  doc.save(fileName)
}