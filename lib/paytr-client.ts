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

export interface CardInfo {
  cc_owner: string // Kart sahibi adı
  card_number: string // Kart numarası (16 haneli)
  expiry_month: string // Son kullanma ayı (1-12)
  expiry_year: string // Son kullanma yılı (YY formatında, örn: 25)
  cvv: string // CVV kodu (3 haneli)
}

export interface PayTRDirectRequest {
  merchant_id: string
  user_ip: string
  merchant_oid: string
  email: string
  payment_type: "card" | "card_points"
  payment_amount: string // Ondalık noktalı format (örn: 100.99)
  installment_count: number // 0, 2-12 arası
  currency?: string // TL, EUR, USD, GBP
  test_mode?: "0" | "1"
  non_3d?: "0" | "1"
  merchant_ok_url: string
  merchant_fail_url: string
  user_name: string
  user_address: string
  user_phone: string
  user_basket: string
  paytr_token: string
  // Kart bilgileri
  cc_owner: string
  card_number: string
  expiry_month: string
  expiry_year: string
  cvv: string
  card_type?: string
  client_lang?: string
  debug_on?: "0" | "1"
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

  /**
   * PayTR Direct API ile ödeme başlatma
   * GÜVENLIK: Kart bilgileri ASLA sunucumuza kaydedilmez!
   * Kart bilgileri direkt olarak PayTR'ye POST edilir (client-side)
   *
   * Bu method sadece token oluşturur, gerçek ödeme client-side yapılır
   */
  async createDirectPaymentToken(
    orderId: string,
    amount: number, // TL cinsinden (örn: 199.00)
    billingInfo: BillingInfo,
    userIp: string,
    options: {
      testMode?: boolean
      non3d?: boolean
      installmentCount?: number
      currency?: "TL" | "EUR" | "USD" | "GBP"
      cardType?: string
    } = {},
  ): Promise<{
    token: string
    formData: Record<string, string>
  }> {
    if (!this.config.merchantId || !this.config.merchantKey || !this.config.merchantSalt) {
      throw new Error("PayTR API credentials are not configured")
    }

    // Sepet bilgilerini hazırla
    const basketItems = [
      {
        name: "Premium Üyelik",
        price: (amount * 100).toString(), // Kuruş cinsine çevir
        quantity: 1,
      },
    ]
    const userBasket = this.encodeBasket(basketItems)

    // Payment amount - Direct API'de ondalık noktalı format kullanılır
    const paymentAmount = amount.toFixed(2)

    // Installment count (0 = taksitsiz, 2-12 arası taksitli)
    const installmentCount = options.installmentCount || 0

    // Token oluşturma için hash string (Direct API formatı)
    // ÖNEMLI: currency token hesaplamasında KULLANILMAZ!
    // Sıralama: merchant_id + user_ip + merchant_oid + email + payment_amount + payment_type + installment_count + test_mode + non_3d + merchant_salt
    const hashStr =
      this.config.merchantId +
      userIp +
      orderId +
      billingInfo.email +
      paymentAmount +
      "card" + // payment_type
      installmentCount.toString() +
      (options.testMode ? "1" : "0") +
      (options.non3d ? "1" : "0") +
      this.config.merchantSalt

    const paytrToken = this.generateToken(hashStr)

    // Form data hazırla (kart bilgileri HARİÇ - onlar client-side eklenecek)
    const formData: Record<string, string> = {
      merchant_id: this.config.merchantId,
      user_ip: userIp,
      merchant_oid: orderId,
      email: billingInfo.email,
      payment_type: "card",
      payment_amount: paymentAmount,
      installment_count: installmentCount.toString(),
      // currency opsiyonel - boş ise TL kabul edilir
      test_mode: options.testMode ? "1" : "0",
      non_3d: options.non3d ? "1" : "0",
      user_name: billingInfo.fullName,
      user_address: billingInfo.address,
      user_phone: billingInfo.phone,
      user_basket: userBasket,
      paytr_token: paytrToken,
      client_lang: "tr",
      debug_on: options.testMode ? "1" : "0",
    }

    // Card type ekle (varsa)
    if (options.cardType) {
      formData.card_type = options.cardType
    }

    return {
      token: paytrToken,
      formData,
    }
  }

  /**
   * Kart numarasını validate et
   * Luhn algoritması ile kart numarası doğrulama
   */
  validateCardNumber(cardNumber: string): boolean {
    // Boşlukları ve tireleri temizle
    const cleaned = cardNumber.replace(/[\s-]/g, "")

    // Sadece rakam kontrolü
    if (!/^\d+$/.test(cleaned)) {
      return false
    }

    // 13-19 hane arası olmalı
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false
    }

    // Luhn algoritması
    let sum = 0
    let isEven = false

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10)

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    return sum % 10 === 0
  }

  /**
   * CVV validate et
   */
  validateCVV(cvv: string): boolean {
    return /^\d{3}$/.test(cvv)
  }

  /**
   * Son kullanma tarihi validate et
   */
  validateExpiryDate(month: string, year: string): boolean {
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)

    // Ay kontrolü
    if (monthNum < 1 || monthNum > 12) {
      return false
    }

    // Yıl kontrolü (YY formatı, 2 haneli)
    if (year.length !== 2) {
      return false
    }

    // Geçmiş tarih kontrolü
    const currentYear = new Date().getFullYear() % 100 // Son 2 hane
    const currentMonth = new Date().getMonth() + 1

    if (yearNum < currentYear) {
      return false
    }

    if (yearNum === currentYear && monthNum < currentMonth) {
      return false
    }

    return true
  }

  // ============================================
  // CAPI - Kart Saklama Sistemi
  // ============================================

  /**
   * CAPI LIST - Kullanıcının kayıtlı kartlarını listele
   * @param utoken - PayTR kullanıcı token'ı
   * @returns Kayıtlı kartlar listesi
   */
  async listSavedCards(utoken: string): Promise<any> {
    const paytrToken = this.generateHash(`${this.config.merchantId}${utoken}${this.config.merchantSalt}`)

    const data = {
      merchant_id: this.config.merchantId,
      utoken,
      paytr_token: paytrToken,
    }

    try {
      const response = await fetch("https://www.paytr.com/odeme/capi/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(data).toString(),
      })

      const result = await response.json()

      if (result.status === "error") {
        throw new Error(result.err_msg || "Kartlar listelenemedi")
      }

      return result
    } catch (error) {
      console.error("[PayTR CAPI LIST] Error:", error)
      throw error
    }
  }

  /**
   * CAPI DELETE - Kayıtlı kartı sil
   * @param utoken - PayTR kullanıcı token'ı
   * @param ctoken - PayTR kart token'ı
   */
  async deleteSavedCard(utoken: string, ctoken: string): Promise<{ status: string; err_msg?: string }> {
    const paytrToken = this.generateHash(`${this.config.merchantId}${utoken}${ctoken}${this.config.merchantSalt}`)

    const data = {
      merchant_id: this.config.merchantId,
      utoken,
      ctoken,
      paytr_token: paytrToken,
    }

    try {
      const response = await fetch("https://www.paytr.com/odeme/capi/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(data).toString(),
      })

      const result = await response.json()

      if (result.status === "error") {
        throw new Error(result.err_msg || "Kart silinemedi")
      }

      return result
    } catch (error) {
      console.error("[PayTR CAPI DELETE] Error:", error)
      throw error
    }
  }

  /**
   * RECURRING PAYMENT - Kayıtlı kart ile otomatik ödeme al (Non3D)
   * @param utoken - PayTR kullanıcı token'ı
   * @param ctoken - PayTR kart token'ı
   * @param orderId - Benzersiz sipariş numarası
   * @param amount - Ödeme tutarı (TL)
   * @param billingInfo - Fatura bilgileri
   * @param userIp - Kullanıcı IP adresi
   * @param cvv - CVV (eğer require_cvv=1 ise gerekli)
   * @returns Ödeme sonucu
   */
  async createRecurringPayment(
    utoken: string,
    ctoken: string,
    orderId: string,
    amount: number,
    billingInfo: BillingInfo,
    userIp: string,
    cvv?: string
  ): Promise<{
    status: "success" | "failed" | "wait_callback"
    msg?: string
    try_again?: boolean
  }> {
    // Sepet içeriği
    const basket = [
      ["Abonelik Yenileme", (amount * 100).toString(), 1], // PayTR kuruş cinsinden ister
    ]
    const userBasket = Buffer.from(JSON.stringify(basket)).toString("base64")

    // Hash hesaplama
    const hashStr = `${this.config.merchantId}${userIp}${orderId}${billingInfo.email}${(amount * 100).toFixed(0)}${userBasket}0${this.config.merchantSalt}`
    const paytrToken = this.generateHash(hashStr)

    const data: any = {
      merchant_id: this.config.merchantId,
      paytr_token: paytrToken,
      user_ip: userIp,
      merchant_oid: orderId,
      email: billingInfo.email,
      payment_type: "card",
      payment_amount: (amount * 100).toFixed(0), // Kuruş cinsinden
      installment_count: 0,
      currency: "TRY",
      client_lang: "tr",
      test_mode: process.env.PAYTR_TEST_MODE === "1" ? "1" : "0",
      non_3d: "1", // Recurring payment Non3D olmak zorunda
      merchant_ok_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/uygulama/ayarlar`,
      merchant_fail_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/uygulama/ayarlar`,
      user_name: billingInfo.fullName,
      user_address: billingInfo.address,
      user_phone: billingInfo.phone,
      user_basket: userBasket,
      debug_on: process.env.NODE_ENV === "development" ? "1" : "0",
      utoken,
      ctoken,
      recurring: "1", // Recurring payment flag
    }

    // CVV varsa ekle
    if (cvv) {
      data.cvv = cvv
    }

    try {
      const response = await fetch("https://www.paytr.com/odeme", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(data).toString(),
      })

      const result = await response.json()

      // Recurring payment JSON response döner (redirect olmaz)
      return {
        status: result.status,
        msg: result.msg,
        try_again: result.try_again,
      }
    } catch (error) {
      console.error("[PayTR RECURRING PAYMENT] Error:", error)
      throw error
    }
  }
}

export const paytrClient = new PayTRClient()
