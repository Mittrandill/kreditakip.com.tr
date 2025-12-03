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
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%); padding: 48px 40px; text-align: center; border-radius: 12px 12px 0 0; }
        .logo { max-width: 203px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1); }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { background: #1e293b; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #334155; }
        .summary-box { background: linear-gradient(145deg, #334155 0%, #475569 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .summary-box h3 { margin: 0 0 10px 0; color: #ffffff; font-size: 16px; }
        .summary-box .total { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
        .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .payment-table thead { background: #334155; }
        .payment-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        .payment-table td { padding: 16px 12px; border-bottom: 1px solid #334155; }
        .payment-table tr:last-child td { border-bottom: none; }
        .bank-cell { display: flex; align-items: center; gap: 12px; }
        .bank-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: white; padding: 4px; border: 1px solid #475569; }
        .bank-name { font-weight: 600; color: #ffffff; font-size: 14px; }
        .installment-badge { background: #334155; color: #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .amount { font-weight: 700; color: #ffffff; font-size: 16px; }
        .due-date { color: #94a3b8; font-size: 13px; }
        .footer { text-align: center; padding: 40px; background: #0f172a; border-top: 1px solid #334155; margin-top: 0; color: #64748b; font-size: 14px; }
        .footer-logo { width: 108px; height: auto; margin-bottom: 20px; opacity: 0.8; }
        .footer-text { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        .copyright { font-size: 11px; color: #475569; border-top: 1px solid #334155; padding-top: 20px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .info-text { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
            <h1>📅 ${data.month} ${data.year} Ödeme Planı</h1>
            <p>Bu ay yapmanız gereken ödemeler</p>
        </div>
        <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>

            <p class="info-text">${data.month} ${data.year} ayında yapmanız gereken ${data.payments.length} ödeme bulunmaktadır. Aşağıda detaylı ödeme planınızı bulabilirsiniz:</p>

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

            <div class="summary-box">
                <h3>💰 Toplam Ödeme Tutarı</h3>
                <p class="total">${data.totalAmount.toLocaleString('tr-TR')} ₺</p>
            </div>

            <p class="info-text">💡 <strong>Hatırlatma:</strong> Ödemelerinizi zamanında yaparak gecikme faizlerinden kaçının ve kredi skorunuzu koruyun.</p>

            <center>
                <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">Ödeme Planını Görüntüle</a>
            </center>
        </div>

        <div class="footer">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">

            <p class="footer-text">
                Bu e-posta otomatik olarak gönderilmiştir.<br>
                E-posta bildirimlerini almak istemiyorsanız, ayarlar sayfasından kapatabilirsiniz.
            </p>

            <div class="copyright">
                © 2025 kreditakip.com.tr • Tüm hakları saklıdır
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
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%); padding: 48px 40px; text-align: center; border-radius: 12px 12px 0 0; }
        .logo { max-width: 203px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1); }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { background: #1e293b; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #334155; }
        .summary-box { background: linear-gradient(145deg, #334155 0%, #475569 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .summary-box h3 { margin: 0 0 10px 0; color: #ffffff; font-size: 16px; }
        .summary-box .total { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; }
        .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .payment-table thead { background: #334155; }
        .payment-table th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        .payment-table td { padding: 16px 12px; border-bottom: 1px solid #334155; }
        .payment-table tr:last-child td { border-bottom: none; }
        .bank-cell { display: flex; align-items: center; gap: 12px; }
        .bank-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: white; padding: 4px; border: 1px solid #475569; }
        .bank-name { font-weight: 600; color: #ffffff; font-size: 14px; }
        .installment-badge { background: #334155; color: #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .amount { font-weight: 700; color: #ffffff; font-size: 16px; }
        .due-date { color: #94a3b8; font-size: 13px; }
        .footer { text-align: center; padding: 40px; background: #0f172a; border-top: 1px solid #334155; margin-top: 0; color: #64748b; font-size: 14px; }
        .footer-logo { width: 108px; height: auto; margin-bottom: 20px; opacity: 0.8; }
        .footer-text { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        .copyright { font-size: 11px; color: #475569; border-top: 1px solid #334155; padding-top: 20px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .info-text { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        .warning-box { background: linear-gradient(145deg, #334155 0%, #475569 100%); border: 1px solid #475569; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .warning-box p { margin: 0; color: #fbbf24; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="logo">
            <h1>📆 Haftalık Ödeme Hatırlatıcısı</h1>
            <p>${data.weekStart} - ${data.weekEnd}</p>
        </div>
        <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>

            ${data.payments.length > 0 ? `
            <p class="info-text">Bu hafta yapmanız gereken <strong>${data.payments.length} ödeme</strong> bulunmaktadır. Ödemelerinizi zamanında yaparak gecikme faizlerinden kaçınabilirsiniz.</p>

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

            <div class="summary-box">
                <h3>💰 Bu Haftanın Toplam Ödemesi</h3>
                <p class="total">${data.totalAmount.toLocaleString('tr-TR')} ₺</p>
            </div>

            <div class="warning-box">
                <p>⏰ <strong>Önemli:</strong> Ödemelerinizi vade tarihinde yapmayı unutmayın!</p>
            </div>
            ` : `
            <p class="info-text">🎉 Harika haber! Bu hafta yapmanız gereken ödeme bulunmamaktadır.</p>
            `}

            <center>
                <a href="https://kreditakip.com.tr/uygulama/odeme-plani" class="cta-button">Ödeme Planını Görüntüle</a>
            </center>
        </div>

        <div class="footer">
            <img src="https://oymjjceuiotxfbpwsdym.supabase.co/storage/v1/object/public/Logo/logo-white.png" alt="Kredi Takip" class="footer-logo">

            <p class="footer-text">
                Bu e-posta otomatik olarak gönderilmiştir.<br>
                E-posta bildirimlerini almak istemiyorsanız, ayarlar sayfasından kapatabilirsiniz.
            </p>

            <div class="copyright">
                © 2025 kreditakip.com.tr • Tüm hakları saklıdır
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
