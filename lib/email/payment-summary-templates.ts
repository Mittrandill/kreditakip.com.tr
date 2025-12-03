// Email templates for payment summaries

interface PaymentItem {
  bankName: string
  bankLogo?: string
  installmentNumber: number
  totalInstallments: number
  amount: number
  dueDate: string
}

interface MonthlyPaymentSummaryData {
  customerName: string
  month: string
  year: string
  payments: PaymentItem[]
  totalAmount: number
}

interface WeeklyPaymentSummaryData {
  customerName: string
  weekStart: string
  weekEnd: string
  payments: PaymentItem[]
  totalAmount: number
}

export const paymentSummaryEmailTemplates = {
  // Monthly payment summary (sent on 1st of each month)
  monthly: {
    subject: (month: string, year: string) => `${month} ${year} - Aylık Ödeme Planı Özeti`,
    html: (data: MonthlyPaymentSummaryData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aylık Ödeme Özeti</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .summary-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .summary-box h3 { margin: 0 0 10px 0; color: #065f46; font-size: 16px; }
        .summary-box .total { font-size: 32px; font-weight: 700; color: #065f46; margin: 0; }
        .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .payment-table thead { background: #f1f5f9; }
        .payment-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; }
        .payment-table td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
        .payment-table tr:last-child td { border-bottom: none; }
        .bank-cell { display: flex; align-items: center; gap: 12px; }
        .bank-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: white; padding: 4px; border: 1px solid #e2e8f0; }
        .bank-name { font-weight: 600; color: #1e293b; font-size: 14px; }
        .installment-badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .amount { font-weight: 700; color: #065f46; font-size: 16px; }
        .due-date { color: #64748b; font-size: 13px; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .info-text { color: #64748b; font-size: 14px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 ${data.month} ${data.year} Ödeme Planı</h1>
            <p>Bu ay yapmanız gereken ödemeler</p>
        </div>
        <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>

            <p class="info-text">${data.month} ${data.year} ayında yapmanız gereken ${data.payments.length} ödeme bulunmaktadır. Aşağıda detaylı ödeme planınızı bulabilirsiniz:</p>

            <div class="summary-box">
                <h3>💰 Toplam Ödeme Tutarı</h3>
                <p class="total">${data.totalAmount.toLocaleString('tr-TR')} ₺</p>
            </div>

            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Banka</th>
                        <th style="text-align: center;">Taksit</th>
                        <th style="text-align: right;">Tutar</th>
                        <th style="text-align: right;">Vade Tarihi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.payments.map(payment => `
                    <tr>
                        <td>
                            <div class="bank-cell">
                                ${payment.bankLogo ? `<img src="${payment.bankLogo}" alt="${payment.bankName}" class="bank-logo" />` : ''}
                                <span class="bank-name">${payment.bankName}</span>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <span class="installment-badge">${payment.installmentNumber}/${payment.totalInstallments}</span>
                        </td>
                        <td style="text-align: right;">
                            <span class="amount">${payment.amount.toLocaleString('tr-TR')} ₺</span>
                        </td>
                        <td style="text-align: right;">
                            <span class="due-date">${new Date(payment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <p class="info-text">💡 <strong>Hatırlatma:</strong> Ödemelerinizi zamanında yaparak gecikme faizlerinden kaçının ve kredi skorunuzu koruyun.</p>

            <center>
                <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">Ödeme Planını Görüntüle</a>
            </center>

            <div class="footer">
                <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
                <p>Bildirimleri ayarlarınızdan yönetebilirsiniz.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },

  // Weekly payment summary (sent every Monday)
  weekly: {
    subject: (weekStart: string, weekEnd: string) => `Bu Hafta (${weekStart} - ${weekEnd}) - Ödeme Hatırlatıcısı`,
    html: (data: WeeklyPaymentSummaryData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Haftalık Ödeme Özeti</title>
    <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .summary-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .summary-box h3 { margin: 0 0 10px 0; color: #92400e; font-size: 16px; }
        .summary-box .total { font-size: 32px; font-weight: 700; color: #92400e; margin: 0; }
        .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .payment-table thead { background: #f1f5f9; }
        .payment-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; }
        .payment-table td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
        .payment-table tr:last-child td { border-bottom: none; }
        .bank-cell { display: flex; align-items: center; gap: 12px; }
        .bank-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: white; padding: 4px; border: 1px solid #e2e8f0; }
        .bank-name { font-weight: 600; color: #1e293b; font-size: 14px; }
        .installment-badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .amount { font-weight: 700; color: #92400e; font-size: 16px; }
        .due-date { color: #64748b; font-size: 13px; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .info-text { color: #64748b; font-size: 14px; line-height: 1.6; }
        .warning-box { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .warning-box p { margin: 0; color: #92400e; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📆 Haftalık Ödeme Hatırlatıcısı</h1>
            <p>${data.weekStart} - ${data.weekEnd}</p>
        </div>
        <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>

            ${data.payments.length > 0 ? `
            <p class="info-text">Bu hafta yapmanız gereken <strong>${data.payments.length} ödeme</strong> bulunmaktadır. Ödemelerinizi zamanında yaparak gecikme faizlerinden kaçınabilirsiniz.</p>

            <div class="summary-box">
                <h3>💰 Bu Haftanın Toplam Ödemesi</h3>
                <p class="total">${data.totalAmount.toLocaleString('tr-TR')} ₺</p>
            </div>

            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Banka</th>
                        <th style="text-align: center;">Taksit</th>
                        <th style="text-align: right;">Tutar</th>
                        <th style="text-align: right;">Vade Tarihi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.payments.map(payment => `
                    <tr>
                        <td>
                            <div class="bank-cell">
                                ${payment.bankLogo ? `<img src="${payment.bankLogo}" alt="${payment.bankName}" class="bank-logo" />` : ''}
                                <span class="bank-name">${payment.bankName}</span>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <span class="installment-badge">${payment.installmentNumber}/${payment.totalInstallments}</span>
                        </td>
                        <td style="text-align: right;">
                            <span class="amount">${payment.amount.toLocaleString('tr-TR')} ₺</span>
                        </td>
                        <td style="text-align: right;">
                            <span class="due-date">${new Date(payment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="warning-box">
                <p>⏰ <strong>Önemli:</strong> Ödemelerinizi vade tarihinden önce yapmayı unutmayın!</p>
            </div>
            ` : `
            <p class="info-text">🎉 Harika haber! Bu hafta yapmanız gereken ödeme bulunmamaktadır.</p>
            `}

            <center>
                <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">Ödeme Planını Görüntüle</a>
            </center>

            <div class="footer">
                <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
                <p>Bildirimleri ayarlarınızdan yönetebilirsiniz.</p>
                <p>© 2024 Kreditakip.com.tr - Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
  },
}

// Helper function to generate monthly summary data
export function generateMonthlyPaymentSummaryData(
  customerName: string,
  month: string,
  year: string,
  payments: PaymentItem[]
): MonthlyPaymentSummaryData {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

  return {
    customerName,
    month,
    year,
    payments,
    totalAmount,
  }
}

// Helper function to generate weekly summary data
export function generateWeeklyPaymentSummaryData(
  customerName: string,
  weekStart: string,
  weekEnd: string,
  payments: PaymentItem[]
): WeeklyPaymentSummaryData {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

  return {
    customerName,
    weekStart,
    weekEnd,
    payments,
    totalAmount,
  }
}
