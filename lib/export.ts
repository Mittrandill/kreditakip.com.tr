import { formatCurrency, formatPercent } from "@/lib/format"

// Excel export için XLSX alternatif implementation
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // CSV için özel karakterleri escape et
        const stringValue = String(value || '')
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  // BOM ekleyerek Türkçe karakter desteği
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Chart verilerini Excel formatına hazırla
export function prepareChartDataForExport(chartData: any[], chartType: string) {
  switch (chartType) {
    case 'payment-trend':
      return chartData.map(item => ({
        'Ay': item.name,
        'Tutar': formatCurrency(item.value),
        'Durum': item.isFuture ? 'Tahmini' : 'Gerçekleşen',
        'Ham Veri': item.value
      }))
    
    case 'debt-distribution': 
      return chartData.map(item => ({
        'Kategori': item.name,
        'Tutar': formatCurrency(item.value),
        'Yüzde': formatPercent(item.value),
        'Ham Veri': item.value
      }))
    
    case 'bank-distribution':
      return chartData.map(item => ({
        'Banka': item.name,
        'Borç Tutarı': formatCurrency(item.value),
        'Ham Veri': item.value
      }))
    
    case 'card-utilization':
      return chartData.map(item => ({
        'Kart Adı': item.name,
        'Kullanım Oranı': formatPercent(item.value),
        'Ham Veri': item.value
      }))
    
    default:
      return chartData
  }
}

// PDF export (canvas kullanarak)
export async function exportChartToPDF(chartElement: HTMLElement, filename: string) {
  try {
    // html2canvas alternatifi - basit screenshot
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) throw new Error('Canvas context not available')
    
    // Chart element'in boyutlarını al
    const rect = chartElement.getBoundingClientRect()
    canvas.width = rect.width * 2 // Retina display için
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    
    // Beyaz background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    // Basit metin export (gerçek chart capture için html2canvas gerekli)
    ctx.fillStyle = 'black'
    ctx.font = '16px Arial'
    ctx.fillText(`${filename} - Chart Export`, 20, 30)
    ctx.fillText(`Export Date: ${new Date().toLocaleDateString('tr-TR')}`, 20, 60)
    
    // Canvas'ı PDF'e dönüştür (jsPDF alternatifi)
    const imageData = canvas.toDataURL('image/png')
    
    // Basit download
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = imageData
    link.click()
    
  } catch (error) {
    console.error('PDF export error:', error)
    throw new Error('PDF export failed')
  }
}

// Rapor verileri hazırla
export function prepareReportData(credits: any[], payments: any[], creditCards: any[]) {
  return {
    summary: {
      'Toplam Kredi Sayısı': credits.length,
      'Aktif Kredi Sayısı': credits.filter(c => c.status === 'active').length,
      'Toplam Borç': formatCurrency(credits.reduce((sum, c) => sum + c.remaining_debt, 0)),
      'Toplam Kart Sayısı': creditCards.length,
      'Aktif Kart Sayısı': creditCards.filter(c => c.is_active).length,
      'Toplam Kart Borcu': formatCurrency(creditCards.reduce((sum, c) => sum + c.current_debt, 0)),
      'Rapor Tarihi': new Date().toLocaleDateString('tr-TR')
    },
    credits: credits.map(credit => ({
      'Kredi Kodu': credit.credit_code,
      'Banka': credit.banks?.name || 'N/A',
      'Kredi Türü': credit.credit_types?.name || 'N/A',
      'Kredi Tutarı': formatCurrency(credit.credit_amount),
      'Kalan Borç': formatCurrency(credit.remaining_debt),
      'Aylık Ödeme': formatCurrency(credit.monthly_payment),
      'Faiz Oranı': formatPercent(credit.interest_rate),
      'Durum': credit.status === 'active' ? 'Aktif' : 'Pasif'
    })),
    payments: payments.map(payment => ({
      'Kredi Kodu': payment.credits?.credit_code || 'N/A',
      'Banka': payment.credits?.banks?.name || 'N/A',
      'Vade Tarihi': new Date(payment.due_date).toLocaleDateString('tr-TR'),
      'Ödeme Tarihi': payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('tr-TR') : 'Ödenmedi',
      'Taksit No': payment.installment_number,
      'Tutar': formatCurrency(payment.total_payment),
      'Durum': payment.status === 'paid' ? 'Ödendi' : payment.status === 'pending' ? 'Beklemede' : 'Gecikmiş'
    })),
    creditCards: creditCards.map(card => ({
      'Kart Adı': card.card_name,
      'Banka': card.bank_name,
      'Kredi Limiti': formatCurrency(card.credit_limit),
      'Mevcut Borç': formatCurrency(card.current_debt),
      'Kullanım Oranı': formatPercent(card.utilization_rate),
      'Durum': card.is_active ? 'Aktif' : 'Pasif'
    }))
  }
}

// Scheduled report için email template
export function generateEmailTemplate(reportData: any, reportType: string) {
  const { summary } = reportData
  
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; }
          .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 ${reportType} Raporu</h1>
          <p>Otomatik oluşturulan finansal rapor - ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        
        <div class="summary">
          <h2>Özet Bilgiler</h2>
          ${Object.entries(summary).map(([key, value]) => 
            `<div class="metric"><strong>${key}:</strong> ${value}</div>`
          ).join('')}
        </div>
        
        <div class="footer">
          <p>Bu rapor otomatik olarak oluşturulmuştur. Detaylı bilgi için uygulamayı ziyaret edin.</p>
          <p>© ${new Date().getFullYear()} KrediTakip - Finansal Yönetim Sistemi</p>
        </div>
      </body>
    </html>
  `
}

// WhatsApp paylaşım mesajı
export function generateWhatsAppMessage(summary: any) {
  return encodeURIComponent(`
📊 *Finansal Durum Özeti* 📊

💳 Toplam Kredi: ${summary['Toplam Kredi Sayısı']}
💰 Toplam Borç: ${summary['Toplam Borç']}
🎯 Aktif Krediler: ${summary['Aktif Kredi Sayısı']}

📅 Rapor Tarihi: ${summary['Rapor Tarihi']}

KrediTakip ile finansal durumunuzu takip edin! 📱
  `)
}

// Export işlemlerini yönet
export class ExportManager {
  static async exportWidget(widgetId: string, widgetData: any, format: 'csv' | 'pdf' | 'image' = 'csv') {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${widgetId}_${timestamp}`
    
    try {
      switch (format) {
        case 'csv':
          const csvData = prepareChartDataForExport(widgetData, widgetId)
          exportToCSV(csvData, filename)
          break
          
        case 'pdf':
          const element = document.getElementById(`widget-${widgetId}`)
          if (element) {
            await exportChartToPDF(element, filename)
          }
          break
          
        case 'image':
          const chartElement = document.querySelector(`#widget-${widgetId} canvas, #widget-${widgetId} svg`)
          if (chartElement) {
            // Canvas veya SVG'yi image olarak kaydet
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            // Basit implementation
            const link = document.createElement('a')
            link.download = `${filename}.png`
            link.click()
          }
          break
      }
      
      return { success: true, message: 'Export başarılı' }
    } catch (error) {
      console.error('Export error:', error)
      return { success: false, message: 'Export başarısız' }
    }
  }
  
  static async scheduleReport(email: string, frequency: 'weekly' | 'monthly', reportTypes: string[]) {
    // Bu fonksiyon backend API'si ile çalışacak
    const scheduleData = {
      email,
      frequency,
      reportTypes,
      createdAt: new Date().toISOString()
    }
    
    // localStorage'da geçici olarak sakla
    const existingSchedules = JSON.parse(localStorage.getItem('scheduledReports') || '[]')
    existingSchedules.push({ ...scheduleData, id: Date.now().toString() })
    localStorage.setItem('scheduledReports', JSON.stringify(existingSchedules))
    
    return { success: true, message: 'Rapor programlandı' }
  }
}