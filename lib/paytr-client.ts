// PayTR Payment Integration
// Documentation: https://www.paytr.com/entegrasyon

import crypto from "crypto"

interface PayTRConfig {
  merchantId: string
  merchantKey: string
  merchantSalt: string
}

export interface BillingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  country?: string
  zipCode?: string
  identityNumber?: string
  taxNumber?: string
  taxOffice?: string
}

export interface PayTRIframeRequest {
  merchant_id: string
  merchant_key: string
  merchant_salt: string
  email: string
  payment_amount: string // Kuruş cinsinden (örn: 19900 = 199.00 TL)
  merchant_oid: string // Sipariş numarası
  user_name: string
  user_address: string
  user_phone: string
  merchant_ok_url: string
  merchant_fail_url: string
  user_basket: string // Base64 encoded basket items
  user_ip: string
  timeout_limit?: string // İşlem zaman aşımı (dakika)
  debug_on?: string // Test modu: "1" veya "0"
  test_mode?: string // Test modu: "1" veya "0"
  no_installment?: string // Taksit kapalı: "1" veya "0"
  max_installment?: string // Maksimum taksit sayısı
  currency?: string // Para birimi: TL, EUR, USD, GBP
  lang?: string // Dil: tr, en
}

export interface PayTRIframeResponse {
  status: "success" | "failed"
  reason?: string
  token?: string
}

export interface PayTRCallbackData {
  merchant_oid: string
  status: string
  total_amount: string
  hash: string
  failed_reason_code?: string
  failed_reason_msg?: string
  test_mode?: string
  payment_type?: string
  currency?: string
  payment_amount?: string
}

export class PayTRClient {
  private config: PayTRConfig

  constructor() {
    this.config = {
      merchantId: process.env.PAYTR_MERCHANT_ID || "",
      merchantKey: process.env.PAYTR_MERCHANT_KEY || "",
      merchantSalt: process.env.PAYTR_MERCHANT_SALT || "",
    }
  }

  /**
   * PayTR token oluşturma (HMAC SHA256)
   */
  private generateToken(data: string): string {
    const hash = crypto
      .createHmac("sha256", this.config.merchantKey)
      .update(data)
      .digest("base64")
    return hash
  }

  /**
   * Sepet verilerini base64 ile encode et
   */
  private encodeBasket(items: Array<{ name: string; price: string; quantity: number }>): string {
    const basketArray = items.map((item) => [item.name, item.price, item.quantity])
    return Buffer.from(JSON.stringify(basketArray)).toString("base64")
  }

  /**
   * PayTR iframe token oluşturma
   * Subscription ödemeleri için iframe kullanıyoruz
   */
  async createIframeToken(
    orderId: string,
    amount: number, // TL cinsinden (örn: 199.00)
    billingInfo: BillingInfo,
    userIp: string,
    successUrl: string,
    failUrl: string,
    options: {
      testMode?: boolean
      noInstallment?: boolean
      maxInstallment?: number
      currency?: "TL" | "EUR" | "USD" | "GBP"
    } = {},
  ): Promise<PayTRIframeResponse> {
    if (!this.config.merchantId || !this.config.merchantKey || !this.config.merchantSalt) {
      throw new Error("PayTR API credentials are not configured")
    }

    // Tutarı kuruş cinsine çevir
    const paymentAmount = Math.round(amount * 100).toString()

    // Sepet bilgilerini hazırla
    const basketItems = [
      {
        name: "Premium Üyelik",
        price: paymentAmount,
        quantity: 1,
      },
    ]
    const userBasket = this.encodeBasket(basketItems)

    // Token oluşturma için hash string
    const hashStr =
      this.config.merchantId +
      userIp +
      orderId +
      billingInfo.email +
      paymentAmount +
      userBasket +
      (options.noInstallment ? "1" : "0") +
      (options.maxInstallment || "0") +
      (options.currency || "TL") +
      (options.testMode ? "1" : "0") +
      this.config.merchantSalt

    const token = this.generateToken(hashStr)

    // PayTR API'ye istek gönder
    const requestData: Record<string, string> = {
      merchant_id: this.config.merchantId,
      user_ip: userIp,
      merchant_oid: orderId,
      email: billingInfo.email,
      payment_amount: paymentAmount,
      paytr_token: token,
      user_basket: userBasket,
      debug_on: options.testMode ? "1" : "0",
      test_mode: options.testMode ? "1" : "0",
      no_installment: options.noInstallment ? "1" : "0",
      max_installment: (options.maxInstallment || 0).toString(),
      user_name: billingInfo.fullName,
      user_address: billingInfo.address,
      user_phone: billingInfo.phone,
      merchant_ok_url: successUrl,
      merchant_fail_url: failUrl,
      timeout_limit: "30",
      currency: options.currency || "TL",
      lang: "tr",
    }

    try {
      const formBody = Object.keys(requestData)
        .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(requestData[key]))
        .join("&")

      const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      })

      const result = await response.json()

      if (result.status === "success") {
        return {
          status: "success",
          token: result.token,
        }
      } else {
        console.error("[PayTR] Token creation failed:", result.reason)
        return {
          status: "failed",
          reason: result.reason || "Unknown error",
        }
      }
    } catch (error) {
      console.error("[PayTR] API error:", error)
      throw error
    }
  }

  /**
   * PayTR callback hash doğrulama
   * Güvenlik için callback'te gelen hash'i doğrulamalıyız
   */
  verifyCallback(callbackData: PayTRCallbackData): boolean {
    const hashStr =
      callbackData.merchant_oid +
      this.config.merchantSalt +
      callbackData.status +
      callbackData.total_amount

    const expectedHash = crypto.createHmac("sha256", this.config.merchantKey).update(hashStr).digest("base64")

    return expectedHash === callbackData.hash
  }

  /**
   * Abonelik iptali için API (PayTR'de manual iptal gerekebilir)
   * Not: PayTR'de otomatik recurring subscription yoktur.
   * Recurring ödemeler için PayTR Direct API veya kart saklama servisi kullanılmalı.
   */
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
    // PayTR'de abonelik iptali genellikle manual yapılır
    // Veya PayTR Direct API kullanılarak kayıtlı kart bilgisi silinir
    console.log("[PayTR] Subscription cancellation requested for:", subscriptionId)

    // Şimdilik sadece veritabanı tarafında iptal ediyoruz
    // Gerçek implementasyonda PayTR'nin kart saklama servisini kullanabilirsiniz
    return {
      success: true,
      message: "Subscription cancelled in database. No recurring charges will occur.",
    }
  }

  /**
   * Test için PayTR iframe URL'i oluştur
   */
  getIframeUrl(token: string): string {
    return `https://www.paytr.com/odeme/guvenli/${token}`
  }
}

export const paytrClient = new PayTRClient()
