// @ts-ignore - node-mailjet types not installed yet
import Mailjet from "node-mailjet"

const mailjet = Mailjet.apiConnect(process.env.MAILJET_API_KEY || "", process.env.MAILJET_SECRET_KEY || "")
// </CHANGE>

interface InvoiceData {
  userId: string
  subscriptionId: string
  planName: string
  planId: string
  amount: number
  currency: string
  paymentId: string
  billingInfo: {
    fullName: string
    email: string
    phone: string
    identityNumber: string
    address: string
    city: string
    district: string
    zipCode: string
    taxOffice?: string
    taxNumber?: string
  }
  paymentDate: string
  expiresAt: string
}

function createInvoiceEmailTemplate(invoice: InvoiceData) {
  const billingPeriod = invoice.planId.includes("yearly") ? "Yıllık" : "Aylık"

  return {
    subject: `Yeni Abonelik Ödemesi - ${invoice.billingInfo.fullName} - ${invoice.amount} ${invoice.currency}`,
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fatura Bildirimi</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }

              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                  line-height: 1.6;
                  color: #1e293b;
                  background-color: #f8fafc;
                  margin: 0;
                  padding: 0;
              }

              .wrapper {
                  width: 100%;
                  background-color: #f8fafc;
                  padding: 40px 20px;
              }

              .main {
                  max-width: 700px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  border: 1px solid #e2e8f0;
              }

              .header {
                  background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                  padding: 32px 40px;
                  text-align: center;
                  color: white;
              }

              .header h1 {
                  font-size: 24px;
                  font-weight: 700;
                  margin-bottom: 8px;
              }

              .header p {
                  font-size: 14px;
                  opacity: 0.95;
              }

              .content {
                  padding: 40px;
              }

              .section {
                  margin-bottom: 32px;
              }

              .section-title {
                  font-size: 18px;
                  font-weight: 700;
                  color: #0f172a;
                  margin-bottom: 16px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #10b981;
              }

              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 16px;
                  margin-bottom: 16px;
              }

              .info-item {
                  background: #f8fafc;
                  padding: 16px;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
              }

              .info-label {
                  font-size: 12px;
                  font-weight: 600;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 4px;
              }

              .info-value {
                  font-size: 15px;
                  color: #0f172a;
                  font-weight: 500;
              }

              .amount-box {
                  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                  border: 2px solid #10b981;
                  border-radius: 12px;
                  padding: 24px;
                  text-align: center;
                  margin: 24px 0;
              }

              .amount-label {
                  font-size: 14px;
                  color: #059669;
                  font-weight: 600;
                  margin-bottom: 8px;
              }

              .amount-value {
                  font-size: 36px;
                  font-weight: 800;
                  color: #047857;
                  letter-spacing: -1px;
              }

              .footer {
                  padding: 24px 40px;
                  background: #f8fafc;
                  border-top: 1px solid #e2e8f0;
                  text-align: center;
              }

              .footer-text {
                  font-size: 12px;
                  color: #64748b;
              }

              @media screen and (max-width: 600px) {
                  .info-grid {
                      grid-template-columns: 1fr;
                  }

                  .content {
                      padding: 24px;
                  }

                  .header {
                      padding: 24px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="wrapper">
              <div class="main">
                  <div class="header">
                      <h1>💳 Yeni Abonelik Ödemesi</h1>
                      <p>Kredi Takip - Ödeme Bildirimi</p>
                  </div>

                  <div class="content">
                      <div class="section">
                          <div class="section-title">📊 Ödeme Bilgileri</div>
                          <div class="info-grid">
                              <div class="info-item">
                                  <div class="info-label">Plan</div>
                                  <div class="info-value">${invoice.planName} (${billingPeriod})</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Plan ID</div>
                                  <div class="info-value">${invoice.planId}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Ödeme Tarihi</div>
                                  <div class="info-value">${new Date(invoice.paymentDate).toLocaleString("tr-TR")}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Geçerlilik Süresi</div>
                                  <div class="info-value">${new Date(invoice.expiresAt).toLocaleDateString("tr-TR")}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Ödeme ID</div>
                                  <div class="info-value">${invoice.paymentId}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Abonelik ID</div>
                                  <div class="info-value">${invoice.subscriptionId}</div>
                              </div>
                          </div>

                          <div class="amount-box">
                              <div class="amount-label">Ödenen Tutar</div>
                              <div class="amount-value">${invoice.amount} ${invoice.currency}</div>
                          </div>
                      </div>

                      <div class="section">
                          <div class="section-title">👤 Müşteri Bilgileri</div>
                          <div class="info-grid">
                              <div class="info-item">
                                  <div class="info-label">Ad Soyad</div>
                                  <div class="info-value">${invoice.billingInfo.fullName}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">E-posta</div>
                                  <div class="info-value">${invoice.billingInfo.email}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Telefon</div>
                                  <div class="info-value">${invoice.billingInfo.phone}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">TC Kimlik No</div>
                                  <div class="info-value">${invoice.billingInfo.identityNumber}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Kullanıcı ID</div>
                                  <div class="info-value">${invoice.userId}</div>
                              </div>
                          </div>
                      </div>

                      <div class="section">
                          <div class="section-title">📍 Adres Bilgileri</div>
                          <div class="info-grid">
                              <div class="info-item" style="grid-column: 1 / -1;">
                                  <div class="info-label">Adres</div>
                                  <div class="info-value">${invoice.billingInfo.address}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">İlçe</div>
                                  <div class="info-value">${invoice.billingInfo.district}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">İl</div>
                                  <div class="info-value">${invoice.billingInfo.city}</div>
                              </div>
                              <div class="info-item">
                                  <div class="info-label">Posta Kodu</div>
                                  <div class="info-value">${invoice.billingInfo.zipCode || "-"}</div>
                              </div>
                          </div>
                      </div>

                      ${
                        invoice.billingInfo.taxOffice || invoice.billingInfo.taxNumber
                          ? `
                      <div class="section">
                          <div class="section-title">🏢 Vergi Bilgileri</div>
                          <div class="info-grid">
                              ${
                                invoice.billingInfo.taxOffice
                                  ? `
                              <div class="info-item">
                                  <div class="info-label">Vergi Dairesi</div>
                                  <div class="info-value">${invoice.billingInfo.taxOffice}</div>
                              </div>
                              `
                                  : ""
                              }
                              ${
                                invoice.billingInfo.taxNumber
                                  ? `
                              <div class="info-item">
                                  <div class="info-label">Vergi Numarası</div>
                                  <div class="info-value">${invoice.billingInfo.taxNumber}</div>
                              </div>
                              `
                                  : ""
                              }
                          </div>
                      </div>
                      `
                          : ""
                      }
                  </div>

                  <div class="footer">
                      <p class="footer-text">
                          Bu e-posta otomatik olarak oluşturulmuştur.<br>
                          © ${new Date().getFullYear()} kreditakip.com.tr • Tüm hakları saklıdır
                      </p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `,
  }
}

export async function sendInvoiceNotification(invoiceData: InvoiceData): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.error("[invoice-email] MAILJET_API_KEY or MAILJET_SECRET_KEY not configured")
      return { success: false, error: "Email service not configured" }
    }
    // </CHANGE>

    const emailTemplate = createInvoiceEmailTemplate(invoiceData)

    const emailData = {
      Messages: [
        {
          From: {
            Email: "bildirim@kreditakip.com.tr",
            Name: "Kredi Takip - Fatura Bildirimi",
          },
          To: [
            {
              Email: "info@kreditakip.com.tr",
              Name: "Kredi Takip Admin",
            },
          ],
          Subject: emailTemplate.subject,
          HTMLPart: emailTemplate.html,
        },
      ],
    }

    console.log("[invoice-email] Sending invoice notification to info@kreditakip.com.tr")

    const result = await mailjet.post("send", { version: "v3.1" }).request(emailData)

    console.log("[invoice-email] Invoice notification sent successfully")

    return {
      success: true,
      messageId: result.body.Messages?.[0]?.To?.[0]?.MessageID || "unknown",
    }
    // </CHANGE>
  } catch (error: any) {
    console.error("[invoice-email] Error sending invoice notification:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
