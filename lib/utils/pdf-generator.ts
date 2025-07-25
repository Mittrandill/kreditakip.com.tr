import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// Turkce karakterleri tamamen kaldirma kurali
const removeTurkishChars = (text: string): string => {
  const charMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    'â': 'a', 'Â': 'A',
    'î': 'i', 'Î': 'I',
    'û': 'u', 'Û': 'U'
  }
  
  return text.replace(/[çğıöşüÇĞİÖŞÜâîûÂÎÛ]/g, (match) => charMap[match] || match)
}

// PDF-safe text constants
const PDF_TEXTS = {
  CREDIT_REPORT: "KREDI RAPORU",
  DETAILED_ANALYSIS: "Detayli Analiz ve Istatistikler",
  CREDIT_INFO: "Kredi Bilgileri",
  CREDIT_CODE: "Kredi Kodu:",
  BANK: "Banka:",
  CREDIT_TYPE: "Kredi Turu:",
  INITIAL_AMOUNT: "Baslangic Tutari:",
  REMAINING_DEBT: "Kalan Borc",
  PAID_INSTALLMENTS: "Odenen Taksit",
  REMAINING_INSTALLMENTS: "Kalan Taksit",
  PROGRESS: "Ilerleme",
  PAYMENT_PLAN: "ODEME PLANI",
  INSTALLMENT: "Taksit",
  DUE_DATE: "Vade Tarihi",
  PRINCIPAL: "Ana Para",
  INTEREST: "Faiz",
  TOTAL: "Toplam",
  REMAINING_DEBT_SHORT: "Kalan Borc",
  STATUS: "Durum",
  PAID: "Odendi",
  PENDING: "Bekliyor",
  OVERDUE: "Gecikti",
  UNKNOWN: "Bilinmeyen",
  PAYMENT_HISTORY: "ODEME GECMISI",
  PAYMENT: "Odeme",
  SUMMARY_STATS: "OZET ISTATISTIKLER",
  TOTAL_PAID: "Toplam Odenen",
  TOTAL_INTEREST: "Toplam Faiz",
  AVG_PAYMENT: "Ortalama Odeme",
  PAYMENT_PERCENTAGE: "Odeme Orani",
  EARLY_PAYMENT_ANALYSIS: "ERKEN ODEME ANALIZI",
  CURRENT_SCENARIO: "Mevcut Senaryo",
  EARLY_PAYMENT_SCENARIO: "Erken Odeme Senaryosu",
  PAYMENT_DATE: "Odeme Tarihi",
  INTEREST_SAVING: "Faiz Tasarrufu",
  TIME_SAVING: "Sure Tasarrufu",
  DAYS: "gun",
  FOOTER: "Bu rapor KrediTakip tarafindan otomatik olarak olusturulmustur.",
  PAGE: "Sayfa",
  REPORT_DATE: "Rapor Tarihi:",
  USER_INFO: "Kullanici Bilgileri",
  NAME_SURNAME: "Ad Soyad:",
  EMAIL: "E-posta:",
  GENERAL_SUMMARY: "Genel Ozet",
  TOTAL_CREDITS: "Toplam Kredi",
  ACTIVE_CREDITS: "Aktif Kredi",
  CLOSED_CREDITS: "Kapanan Kredi",
  FINANCIAL_SUMMARY: "Mali Ozet",
  TOTAL_DEBT: "Toplam Borc",
  TOTAL_PAYMENT: "Toplam Odeme",
  MONTHLY_PAYMENT: "Aylik Odeme",
  CREDIT_DETAILS: "Kredi Detaylari",
  TERM: "Vade",
  MONTH: "ay",
  ACTIVE: "Aktif",
  CLOSED: "Kapandi",
  ADDITIONAL_REPORTS: "Ek Raporlar",
  CHART_DATA_AVAILABLE: "Grafik verisi mevcut"
}

interface PaymentPlan {
  installmentNumber: number
  dueDate: Date
  principal: number
  interest: number
  totalPayment: number
  remainingDebt: number
  status: 'paid' | 'pending' | 'overdue' | string
  paidAmount?: number
  paidDate?: Date
}

interface PaymentHistory {
  date: Date
  amount: number
  type: string
  description?: string
}

interface CreditReport {
  creditId: string
  creditCode: string
  bankName: string
  creditType: string
  initialAmount: number
  remainingDebt: number
  paidInstallments: number
  totalInstallments: number
  interestRate: number
  monthlyPayment: number
  startDate: Date
  paymentPlan: PaymentPlan[]
  paymentHistory?: PaymentHistory[]
  totalPaidAmount?: number
  totalInterestPaid?: number
}

export interface ReportData {
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
  credits: any[]
  selectedReports?: string[]
  chartData?: {
    monthlyPayments?: any[]
    creditDistribution?: any[]
    interestAnalysis?: any[]
    paymentCalendar?: any[]
  }
  selectedBanks?: string[]
}

const getBankLogos = () => {
  return {
    'Ziraat Bankasi': { color: '#00a651', short: 'ZB' },
    'Garanti BBVA': { color: '#00a0df', short: 'GB' },
    'Is Bankasi': { color: '#0054a6', short: 'IB' },
    'Akbank': { color: '#e31e24', short: 'AB' },
    'Yapi Kredi': { color: '#ffcd00', short: 'YK' },
    'Halkbank': { color: '#00a651', short: 'HB' },
    'VakifBank': { color: '#1f4e79', short: 'VB' },
    'DenizBank': { color: '#ff6600', short: 'DB' },
    'Kuveyt Turk': { color: '#00a651', short: 'KT' },
    'Turkiye Finans': { color: '#00a651', short: 'TF' }
  }
}

const getBankLogo = (bankName: string): { color: string, short: string } => {
  const logos = getBankLogos()
  return logos[bankName as keyof typeof logos] || { color: '#6b7280', short: bankName.slice(0, 2).toUpperCase() }
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [107, 114, 128]
}

export const generateDetailedPDFReport = (report: CreditReport) => {
  const doc = new jsPDF()
  
  // Logo ve baslik
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20
  
  // KrediTakip logosu
  doc.setFillColor(59, 130, 246)
  doc.rect(pageWidth/2 - 20, yPosition - 15, 40, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('KREDITAKIP', pageWidth/2, yPosition - 7, { align: 'center' })
  
  doc.setFontSize(22)
  doc.setTextColor(31, 41, 55)
  doc.text(PDF_TEXTS.CREDIT_REPORT, pageWidth / 2, yPosition + 10, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128)
  doc.text(PDF_TEXTS.DETAILED_ANALYSIS, pageWidth / 2, yPosition + 18, { align: 'center' })
  
  // Kredi bilgileri kutusu
  yPosition = 55
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(20, yPosition, pageWidth - 40, 45, 3, 3, 'FD')
  
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text(PDF_TEXTS.CREDIT_INFO, 30, yPosition + 10)
  
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128)
  const infoY = yPosition + 20
  doc.text(`${PDF_TEXTS.CREDIT_CODE} ${report.creditCode}`, 30, infoY)
  doc.text(`${PDF_TEXTS.BANK} ${removeTurkishChars(report.bankName)}`, 30, infoY + 7)
  doc.text(`${PDF_TEXTS.CREDIT_TYPE} ${removeTurkishChars(report.creditType)}`, 30, infoY + 14)
  doc.text(`${PDF_TEXTS.INITIAL_AMOUNT} ${report.initialAmount.toLocaleString('tr-TR')} TL`, 120, infoY)
  doc.text(`${PDF_TEXTS.INTEREST} %${report.interestRate}`, 120, infoY + 7)
  doc.text(`${PDF_TEXTS.MONTHLY_PAYMENT} ${report.monthlyPayment.toLocaleString('tr-TR')} TL`, 120, infoY + 14)
  
  // Ilerleme durumu
  yPosition = 110
  const stats = [
    { label: PDF_TEXTS.REMAINING_DEBT, value: `${report.remainingDebt.toLocaleString('tr-TR')} TL`, color: [239, 68, 68] },
    { label: PDF_TEXTS.PAID_INSTALLMENTS, value: `${report.paidInstallments} / ${report.totalInstallments}`, color: [34, 197, 94] },
    { label: PDF_TEXTS.REMAINING_INSTALLMENTS, value: `${report.totalInstallments - report.paidInstallments}`, color: [59, 130, 246] },
    { label: PDF_TEXTS.PROGRESS, value: `%${Math.round((report.paidInstallments / report.totalInstallments) * 100)}`, color: [168, 85, 247] }
  ]
  
  stats.forEach((stat, index) => {
    const xPos = 20 + (index * 45)
    
    doc.setDrawColor(229, 231, 235)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(xPos, yPosition, 42, 30, 2, 2, 'FD')
    
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(stat.label, xPos + 21, yPosition + 10, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(...stat.color)
    doc.text(stat.value, xPos + 21, yPosition + 20, { align: 'center' })
  })
  
  // Odeme plani tablosu
  yPosition = 150
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text(PDF_TEXTS.PAYMENT_PLAN, 20, yPosition)
  
  yPosition += 10
  
  // Tablo basliklari
  const headers = [
    { text: PDF_TEXTS.INSTALLMENT, width: 20 },
    { text: PDF_TEXTS.DUE_DATE, width: 35 },
    { text: PDF_TEXTS.PRINCIPAL, width: 30 },
    { text: PDF_TEXTS.INTEREST, width: 30 },
    { text: PDF_TEXTS.TOTAL, width: 30 },
    { text: PDF_TEXTS.REMAINING_DEBT_SHORT, width: 35 },
    { text: PDF_TEXTS.STATUS, width: 25 }
  ]
  
  doc.setFillColor(243, 244, 246)
  doc.rect(20, yPosition, pageWidth - 40, 8, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  let xPos = 22
  headers.forEach(header => {
    doc.text(header.text, xPos, yPosition + 5.5)
    xPos += header.width
  })
  
  yPosition += 8
  
  // Tablo satirlari
  doc.setFontSize(9)
  const maxRowsPerPage = 20
  let rowCount = 0
  
  report.paymentPlan.slice(0, 12).forEach((payment, index) => {
    if (rowCount >= maxRowsPerPage) {
      doc.addPage()
      yPosition = 20
      rowCount = 0
      
      // Baslik tekrar
      doc.setFillColor(243, 244, 246)
      doc.rect(20, yPosition, pageWidth - 40, 8, 'F')
      doc.setFontSize(10)
      doc.setTextColor(75, 85, 99)
      xPos = 22
      headers.forEach(header => {
        doc.text(header.text, xPos, yPosition + 5.5)
        xPos += header.width
      })
      yPosition += 8
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(20, yPosition, pageWidth - 40, 7, 'F')
    }
    
    xPos = 22
    doc.setTextColor(55, 65, 81)
    
    const rowData = [
      payment.installmentNumber.toString(),
      format(payment.dueDate, 'dd.MM.yyyy'),
      `${payment.principal.toLocaleString('tr-TR')} TL`,
      `${payment.interest.toLocaleString('tr-TR')} TL`,
      `${payment.totalPayment.toLocaleString('tr-TR')} TL`,
      `${payment.remainingDebt.toLocaleString('tr-TR')} TL`,
      payment.status === 'paid' ? PDF_TEXTS.PAID : 
        payment.status === 'pending' ? PDF_TEXTS.PENDING : 
        payment.status === 'overdue' ? PDF_TEXTS.OVERDUE : PDF_TEXTS.UNKNOWN
    ]
    
    const statusColors: { [key: string]: number[] } = {
      'paid': [34, 197, 94],
      'pending': [251, 146, 60],
      'overdue': [239, 68, 68]
    }
    
    rowData.forEach((data, i) => {
      if (i === rowData.length - 1 && payment.status in statusColors) {
        doc.setTextColor(...statusColors[payment.status])
      }
      doc.text(data, xPos, yPosition + 5)
      xPos += headers[i].width
    })
    
    yPosition += 7
    rowCount++
  })
  
  // Odeme gecmisi (eger varsa)
  if (report.paymentHistory && report.paymentHistory.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    } else {
      yPosition += 15
    }
    
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text(PDF_TEXTS.PAYMENT_HISTORY, 20, yPosition)
    
    yPosition += 10
    
    doc.setFillColor(243, 244, 246)
    doc.rect(20, yPosition, pageWidth - 40, 8, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    doc.text(PDF_TEXTS.PAYMENT_DATE, 25, yPosition + 5.5)
    doc.text(PDF_TEXTS.PAYMENT, 80, yPosition + 5.5)
    doc.text(PDF_TEXTS.CREDIT_TYPE, 130, yPosition + 5.5)
    
    yPosition += 8
    
    doc.setFontSize(9)
    report.paymentHistory.slice(0, 10).forEach((history, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(20, yPosition, pageWidth - 40, 7, 'F')
      }
      
      doc.setTextColor(55, 65, 81)
      doc.text(format(history.date, 'dd.MM.yyyy HH:mm'), 25, yPosition + 5)
      doc.text(`${history.amount.toLocaleString('tr-TR')} TL`, 80, yPosition + 5)
      doc.text(removeTurkishChars(history.type), 130, yPosition + 5)
      
      yPosition += 7
    })
  }
  
  // Ozet istatistikler
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  } else {
    yPosition += 15
  }
  
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text(PDF_TEXTS.SUMMARY_STATS, 20, yPosition)
  
  yPosition += 10
  
  const summaryStats = [
    { label: PDF_TEXTS.TOTAL_PAID, value: `${(report.totalPaidAmount || 0).toLocaleString('tr-TR')} TL` },
    { label: PDF_TEXTS.TOTAL_INTEREST, value: `${(report.totalInterestPaid || 0).toLocaleString('tr-TR')} TL` },
    { label: PDF_TEXTS.AVG_PAYMENT, value: `${report.monthlyPayment.toLocaleString('tr-TR')} TL` },
    { label: PDF_TEXTS.PAYMENT_PERCENTAGE, value: `%${Math.round((report.paidInstallments / report.totalInstallments) * 100)}` }
  ]
  
  summaryStats.forEach((stat, index) => {
    const xPos = 20 + (index * 45)
    
    doc.setDrawColor(229, 231, 235)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(xPos, yPosition, 42, 25, 2, 2, 'FD')
    
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(stat.label, xPos + 21, yPosition + 10, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.text(stat.value, xPos + 21, yPosition + 18, { align: 'center' })
  })
  
  // Erken odeme analizi
  if (yPosition > pageHeight - 80) {
    doc.addPage()
    yPosition = 20
  } else {
    yPosition += 40
  }
  
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text(PDF_TEXTS.EARLY_PAYMENT_ANALYSIS, 20, yPosition)
  
  yPosition += 10
  
  // Mevcut vs Erken odeme karsilastirmasi
  const scenarios = [
    {
      title: PDF_TEXTS.CURRENT_SCENARIO,
      data: [
        { label: PDF_TEXTS.REMAINING_INSTALLMENTS, value: `${report.totalInstallments - report.paidInstallments} ${PDF_TEXTS.MONTH}` },
        { label: PDF_TEXTS.TOTAL_PAYMENT, value: `${((report.totalInstallments - report.paidInstallments) * report.monthlyPayment).toLocaleString('tr-TR')} TL` }
      ]
    },
    {
      title: PDF_TEXTS.EARLY_PAYMENT_SCENARIO,
      data: [
        { label: PDF_TEXTS.PAYMENT_DATE, value: format(new Date(), 'dd.MM.yyyy') },
        { label: PDF_TEXTS.REMAINING_DEBT, value: `${report.remainingDebt.toLocaleString('tr-TR')} TL` }
      ]
    }
  ]
  
  scenarios.forEach((scenario, sIndex) => {
    const xOffset = sIndex * 95
    
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(20 + xOffset, yPosition, 90, 40, 3, 3, 'F')
    
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.text(scenario.title, 65 + xOffset, yPosition + 8, { align: 'center' })
    
    doc.setFontSize(9)
    scenario.data.forEach((item, index) => {
      doc.setTextColor(107, 114, 128)
      doc.text(item.label, 25 + xOffset, yPosition + 20 + (index * 10))
      doc.setTextColor(31, 41, 55)
      doc.text(item.value, 25 + xOffset, yPosition + 25 + (index * 10))
    })
  })
  
  // Tasarruf bilgisi
  yPosition += 50
  const interestSaving = ((report.totalInstallments - report.paidInstallments) * report.monthlyPayment) - report.remainingDebt
  const timeSaving = report.totalInstallments - report.paidInstallments
  
  if (interestSaving > 0) {
    doc.setDrawColor(34, 197, 94)
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(20, yPosition, pageWidth - 40, 25, 3, 3, 'FD')
    
    doc.setFontSize(11)
    doc.setTextColor(34, 197, 94)
    doc.text(`${PDF_TEXTS.INTEREST_SAVING}: ${interestSaving.toLocaleString('tr-TR')} TL`, pageWidth / 2, yPosition + 10, { align: 'center' })
    doc.text(`${PDF_TEXTS.TIME_SAVING}: ${timeSaving} ${PDF_TEXTS.MONTH} (${timeSaving * 30} ${PDF_TEXTS.DAYS})`, pageWidth / 2, yPosition + 18, { align: 'center' })
  }
  
  // Alt bilgi
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text(PDF_TEXTS.FOOTER, pageWidth / 2, pageHeight - 10, { align: 'center' })
  doc.text(`${PDF_TEXTS.PAGE} 1`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  
  // PDF'i kaydet
  const fileName = `kredi-detay-${report.creditCode}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF()
  
  // Sayfa boyutlari
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (2 * margin)
  let yPosition = margin
  
  // Logo ekleme
  doc.setFillColor(59, 130, 246)
  doc.rect(pageWidth/2 - 20, yPosition - 10, 40, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('KREDITAKIP', pageWidth/2, yPosition - 3, { align: 'center' })
  
  // Baslik ve tarih
  yPosition += 10
  doc.setFontSize(24)
  doc.setTextColor(0, 0, 0)
  doc.text(removeTurkishChars('KREDI TAKIP RAPORU'), pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 10
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  const reportDate = format(new Date(), 'dd MMMM yyyy', { locale: tr })
  doc.text(removeTurkishChars(`${PDF_TEXTS.REPORT_DATE} ${reportDate}`), pageWidth / 2, yPosition, { align: 'center' })
  
  // Kullanici bilgileri
  yPosition += 20
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(PDF_TEXTS.USER_INFO, margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  doc.text(removeTurkishChars(`${PDF_TEXTS.NAME_SURNAME} ${data.userData.name}`), margin, yPosition)
  yPosition += 7
  doc.text(removeTurkishChars(`${PDF_TEXTS.EMAIL} ${data.userData.email}`), margin, yPosition)
  
  // Genel ozet
  yPosition += 20
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(PDF_TEXTS.GENERAL_SUMMARY, margin, yPosition)
  
  yPosition += 10
  
  // Ozet kutucuklari
  const summaryBoxes = [
    { label: PDF_TEXTS.TOTAL_CREDITS, value: data.totalCredits.toString() },
    { label: PDF_TEXTS.ACTIVE_CREDITS, value: data.activeCredits.toString() },
    { label: PDF_TEXTS.CLOSED_CREDITS, value: data.closedCredits.toString() },
  ]
  
  const boxWidth = contentWidth / 3 - 5
  const boxHeight = 25
  
  summaryBoxes.forEach((box, index) => {
    const xPos = margin + (index * (boxWidth + 5))
    
    // Kutucuk arka plani
    doc.setFillColor(245, 245, 245)
    doc.rect(xPos, yPosition, boxWidth, boxHeight, 'F')
    
    // Kutucuk icerigi
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(box.label, xPos + boxWidth / 2, yPosition + 8, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(box.value, xPos + boxWidth / 2, yPosition + 18, { align: 'center' })
  })
  
  // Mali ozet
  yPosition += 40
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(PDF_TEXTS.FINANCIAL_SUMMARY, margin, yPosition)
  
  yPosition += 10
  
  const financialData = [
    { label: PDF_TEXTS.TOTAL_DEBT, value: `${data.totalDebt.toLocaleString('tr-TR')} TL` },
    { label: PDF_TEXTS.TOTAL_PAYMENT, value: `${data.totalPayment.toLocaleString('tr-TR')} TL` },
    { label: PDF_TEXTS.MONTHLY_PAYMENT, value: `${data.monthlyPayment.toLocaleString('tr-TR')} TL` },
  ]
  
  financialData.forEach((item, index) => {
    const xPos = margin + (index * (boxWidth + 5))
    
    doc.setFillColor(240, 250, 255)
    doc.rect(xPos, yPosition, boxWidth, boxHeight, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, xPos + boxWidth / 2, yPosition + 8, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(0, 50, 100)
    doc.text(removeTurkishChars(item.value), xPos + boxWidth / 2, yPosition + 18, { align: 'center' })
  })
  
  // Kredi detaylari
  if (data.credits && data.credits.length > 0) {
    // Banka filtreleme
    let filteredCredits = data.credits
    if (data.selectedBanks && data.selectedBanks.length > 0) {
      filteredCredits = data.credits.filter(credit => 
        data.selectedBanks?.includes(credit.bankName)
      )
    }
    
    yPosition += 40
    
    // Yeni sayfa kontrolu
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(PDF_TEXTS.CREDIT_DETAILS, margin, yPosition)
    
    yPosition += 10
    
    // Tablo basliklari
    const tableHeaders = [PDF_TEXTS.BANK, PDF_TEXTS.CREDIT_TYPE, PDF_TEXTS.TOTAL, PDF_TEXTS.INTEREST, PDF_TEXTS.TERM, PDF_TEXTS.MONTHLY_PAYMENT, PDF_TEXTS.STATUS]
    const colWidths = [30, 35, 25, 20, 20, 30, 25]
    
    // Baslik satiri
    doc.setFillColor(50, 50, 50)
    doc.rect(margin, yPosition, contentWidth, 10, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    let xPos = margin
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos + 2, yPosition + 7)
      xPos += colWidths[i]
    })
    
    yPosition += 10
    
    // Kredi satirlari
    doc.setTextColor(0, 0, 0)
    filteredCredits.forEach((credit, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
        
        // Basliklari tekrar ekle
        doc.setFillColor(50, 50, 50)
        doc.rect(margin, yPosition, contentWidth, 10, 'F')
        
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        xPos = margin
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos + 2, yPosition + 7)
          xPos += colWidths[i]
        })
        
        yPosition += 10
        doc.setTextColor(0, 0, 0)
      }
      
      // Satir arka plani
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, yPosition, contentWidth, 10, 'F')
      }
      
      xPos = margin
      doc.setFontSize(9)
      
      const rowData = [
        credit.bankName || '-',
        credit.creditType || '-',
        `${(credit.amount || 0).toLocaleString('tr-TR')} TL`,
        `%${credit.interestRate || 0}`,
        `${credit.term || 0} ${PDF_TEXTS.MONTH}`,
        `${(credit.monthlyPayment || 0).toLocaleString('tr-TR')} TL`,
        credit.status === 'active' ? PDF_TEXTS.ACTIVE : PDF_TEXTS.CLOSED
      ]
      
      const bankLogo = getBankLogo(credit.bankName || '')
      
      rowData.forEach((data, i) => {
        if (i === 0 && credit.bankName) {
          // Banka logosu ve ismi
          const logoColor = hexToRgb(bankLogo.color)
          doc.setFillColor(logoColor[0], logoColor[1], logoColor[2])
          doc.circle(xPos + 8, yPosition + 5, 3, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(6)
          doc.text(bankLogo.short, xPos + 8, yPosition + 6, { align: 'center' })
          
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(9)
          doc.text(removeTurkishChars(data), xPos + 16, yPosition + 7)
        } else {
          doc.text(removeTurkishChars(data), xPos + 2, yPosition + 7)
        }
        xPos += colWidths[i]
      })
      
      yPosition += 10
    })
  }
  
  // Secili raporlar ve grafikler
  if (data.selectedReports && data.selectedReports.length > 0) {
    yPosition += 20
    
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(PDF_TEXTS.ADDITIONAL_REPORTS, margin, yPosition)
    
    yPosition += 10
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    
    const reportNames: { [key: string]: string } = {
      'payment-schedule': 'Odeme Takvimi',
      'interest-analysis': 'Faiz Analizi',
      'bank-comparison': 'Banka Karsilastirmasi',
      'early-payment': 'Erken Odeme Analizi',
      'monthly-payments': 'Aylik Odeme Grafigi',
      'credit-distribution': 'Kredi Dagilimi',
      'interest-chart': 'Faiz Analiz Grafigi',
      'payment-calendar': 'Odeme Takvimi Grafigi'
    }
    
    data.selectedReports.forEach(report => {
      doc.text(removeTurkishChars(`\u2022 ${reportNames[report] || report}`), margin + 5, yPosition)
      yPosition += 7
      
      // Grafik verilerini ekle
      if (data.chartData) {
        if (report === 'monthly-payments' && data.chartData.monthlyPayments) {
          yPosition += 5
          doc.setFontSize(10)
          doc.text(removeTurkishChars(`  ${PDF_TEXTS.CHART_DATA_AVAILABLE}`), margin + 10, yPosition)
          yPosition += 7
        }
        if (report === 'credit-distribution' && data.chartData.creditDistribution) {
          yPosition += 5
          doc.setFontSize(10)
          doc.text(removeTurkishChars(`  ${PDF_TEXTS.CHART_DATA_AVAILABLE}`), margin + 10, yPosition)
          yPosition += 7
        }
      }
    })
  }
  
  // Alt bilgi
  const footerY = pageHeight - 20
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(PDF_TEXTS.FOOTER, pageWidth / 2, footerY, { align: 'center' })
  doc.text(`${PDF_TEXTS.PAGE} 1`, pageWidth / 2, footerY + 5, { align: 'center' })
  
  // PDF'i indir
  const fileName = `kredi-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}