import crypto from "crypto"

/**
 * PayTR Direkt API Client
 *
 * Official Documentation:
 * - Direkt API: https://dev.paytr.com/en/direkt-api
 * - Hash Generation: https://dev.paytr.com/en/direkt-api/direkt-api-hash-olusturma
 */

export interface PayTRBasketItem {
  name: string
  price: number // Price in kuruş (cents)
  quantity: number
}

export interface PayTRPaymentOptions {
  userId: string
  planId: string
  email: string
  amount: number // Total amount in kuruş
  orderId: string // Unique order ID (merchant_oid)
  userIp: string
  basket: PayTRBasketItem[]
  callbackUrl: string
  successUrl: string
  failUrl: string
  userName?: string
  userAddress?: string
  userPhone?: string
  // Direkt API specific
  cardNumber?: string
  cardExpiry?: string // MM/YY
  cardCvv?: string
  cardHolderName?: string
}

export interface PayTRPaymentResponse {
  status: "success" | "failed"
  token?: string // iFrame token (not used in Direkt API)
  redirect_url?: string // 3D Secure redirect URL for Direkt API
  reason?: string
}

export interface PayTRCallbackData {
  merchant_oid: string
  status: string // "success" or "failed"
  total_amount: string
  hash: string
  failed_reason_code?: string
  failed_reason_msg?: string
  test_mode: string // "0" or "1"
  payment_type: string // "card", "eft", etc.
  currency: string
  installment_count?: string
}

export class PayTRClient {
  private merchantId: string
  private merchantKey: string
  private merchantSalt: string
  private isTestMode: boolean
  private apiUrl: string

  constructor() {
    this.merchantId = process.env.PAYTR_MERCHANT_ID || ""
    this.merchantKey = process.env.PAYTR_MERCHANT_KEY || ""
    this.merchantSalt = process.env.PAYTR_MERCHANT_SALT || ""
    this.isTestMode = process.env.PAYTR_TEST_MODE === "1"
    // Direkt API endpoint
    this.apiUrl = "https://www.paytr.com/odeme"

    if (!this.merchantId || !this.merchantKey || !this.merchantSalt) {
      throw new Error("PayTR credentials are not configured")
    }
  }

  /**
   * Generate payment token hash for Direkt API (HMAC-SHA256 + Base64)
   *
   * Hash Formula (from PayTR Direkt API docs):
   * hash = base64(hmacsha256(merchant_id + user_ip + merchant_oid + email + payment_amount +
   *                           payment_type + installment_count + currency + test_mode + non_3d + merchant_salt,
   *                           merchant_key))
   */
  private generatePaymentToken(params: {
    merchantId: string
    userIp: string
    merchantOid: string
    email: string
    paymentAmount: string
    paymentType: string
    installmentCount: string
    currency: string
    testMode: string
    non3d: string
  }): string {
    const {
      merchantId,
      userIp,
      merchantOid,
      email,
      paymentAmount,
      paymentType,
      installmentCount,
      currency,
      testMode,
      non3d,
    } = params

    // Concatenate all parameters (Direkt API format)
    const hashStr =
      merchantId +
      userIp +
      merchantOid +
      email +
      paymentAmount +
      paymentType +
      installmentCount +
      currency +
      testMode +
      non3d

    // Create HMAC-SHA256 hash with salt
    // HMAC(data, key) -> HMAC(hashStr + merchantSalt, merchantKey)
    const paytrToken = crypto
      .createHmac("sha256", this.merchantKey)
      .update(hashStr + this.merchantSalt)
      .digest("base64")

    return paytrToken
  }

  /**
   * Encode basket items to PayTR format
   * Format: [[name, price, quantity], [name, price, quantity], ...]
   * Then base64 encode
   */
  private encodeBasket(items: PayTRBasketItem[]): string {
    const basketArray = items.map((item) => [
      item.name,
      item.price.toString(),
      item.quantity.toString(),
    ])

    const basketJson = JSON.stringify(basketArray)
    return Buffer.from(basketJson).toString("base64")
  }

  /**
   * Create PayTR Direkt API payment request
   */
  async createPaymentRequest(
    options: PayTRPaymentOptions
  ): Promise<PayTRPaymentResponse> {
    const {
      userId,
      planId,
      email,
      amount,
      orderId,
      userIp,
      basket,
      callbackUrl,
      successUrl,
      failUrl,
      userName = "",
      userAddress = "",
      userPhone = "",
      cardNumber = "",
      cardExpiry = "",
      cardCvv = "",
      cardHolderName = "",
    } = options

    // Encode basket
    const userBasket = this.encodeBasket(basket)

    // Payment parameters for Direkt API
    const currency = "TL"
    const testMode = this.isTestMode ? "1" : "0"
    const paymentType = "card" // Direkt API uses 'card'
    const installmentCount = "0" // No installment
    const non3d = "0" // Use 3D Secure
    const paymentAmount = amount.toString()

    // Split card expiry (MM/YY -> MM and YY)
    const [expMonth = "", expYear = ""] = cardExpiry.split("/")

    // Generate payment token (Direkt API format)
    const paytrToken = this.generatePaymentToken({
      merchantId: this.merchantId,
      userIp,
      merchantOid: orderId,
      email,
      paymentAmount,
      paymentType,
      installmentCount,
      currency,
      testMode,
      non3d,
    })

    // Prepare request body for Direkt API
    const requestBody = new URLSearchParams({
      merchant_id: this.merchantId,
      user_ip: userIp,
      merchant_oid: orderId,
      email: email,
      payment_amount: paymentAmount,
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: testMode,
      user_name: userName || cardHolderName || email.split("@")[0],
      user_address: userAddress || "Turkey",
      user_phone: userPhone || "5555555555",
      merchant_ok_url: successUrl,
      merchant_fail_url: failUrl,
      timeout_limit: "30",
      currency: currency,
      test_mode: testMode,
      client_lang: "tr", // Türkçe
      // Direkt API specific fields
      payment_type: paymentType,
      installment_count: installmentCount,
      non_3d: non3d,
      // Card details
      cc_owner: cardHolderName || userName || email.split("@")[0],
      card_number: cardNumber.replace(/\s/g, ""),
      expiry_month: expMonth.trim(),
      expiry_year: expYear.trim(),
      cvv: cardCvv,
    })

    try {
      // Debug log - Request parameters
      console.log("[PayTR Client] Request to:", this.apiUrl)
      console.log("[PayTR Client] Test Mode:", testMode)
      console.log("[PayTR Client] Merchant ID:", this.merchantId)
      console.log("[PayTR Client] Order ID:", orderId)
      console.log("[PayTR Client] Amount:", paymentAmount)
      console.log("[PayTR Client] Basket:", userBasket)
      console.log("[PayTR Client] User IP:", userIp)

      // Make request to PayTR Direkt API
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      })

      // Get response as text first
      const responseText = await response.text()
      console.log("[PayTR Client] Response status:", response.status)
      console.log("[PayTR Client] Response (first 500 chars):", responseText.substring(0, 500))

      // Check if HTML (3D Secure page) or JSON
      if (responseText.trim().startsWith('<!')) {
        // PayTR returned 3D Secure HTML page directly

        // Store HTML in our endpoint and get a URL
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          const storeResponse = await fetch(`${appUrl}/api/paytr/3d-secure`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ html: responseText }),
          })

          const storeData = await storeResponse.json()

          if (!storeData.success || !storeData.url) {
            console.error("[PayTR] Failed to store 3D Secure HTML:", storeData)
            return {
              status: "failed",
              reason: "Failed to prepare 3D Secure page",
            }
          }

          // Return the full URL to the 3D Secure page
          return {
            status: "success",
            redirect_url: `${appUrl}${storeData.url}`,
          }
        } catch (error: any) {
          console.error("[PayTR] Error storing 3D Secure HTML:", error)
          return {
            status: "failed",
            reason: "Failed to prepare 3D Secure page",
          }
        }
      }

      // Try to parse as JSON
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("[PayTR] Response is not JSON and not HTML:", responseText.substring(0, 100))
        return {
          status: "failed",
          reason: `Invalid PayTR response: ${responseText.substring(0, 100)}`,
        }
      }

      if (data.status === "success") {
        // Direkt API returns redirect URL for 3D Secure
        const redirectUrl = data.redirect_url || data.url
        if (!redirectUrl) {
          console.error("[PayTR] No redirect URL in response:", data)
          return {
            status: "failed",
            reason: "No redirect URL returned from PayTR",
          }
        }

        return {
          status: "success",
          redirect_url: redirectUrl, // 3D Secure page URL
        }
      } else {
        console.error("[PayTR] Payment request failed:", data)
        return {
          status: "failed",
          reason: data.reason || "Unknown error",
        }
      }
    } catch (error: any) {
      console.error("[PayTR] API request error:", error)
      return {
        status: "failed",
        reason: error.message || "Network error",
      }
    }
  }

  /**
   * Verify PayTR callback signature
   *
   * Hash Formula (from PayTR docs):
   * hash = base64(hmacsha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))
   */
  verifyCallback(callbackData: PayTRCallbackData): boolean {
    const { merchant_oid, status, total_amount, hash } = callbackData

    // Generate expected hash
    const hashStr = merchant_oid + this.merchantSalt + status + total_amount

    // HMAC(data, key) -> HMAC(hashStr, merchantKey)
    const expectedHash = crypto
      .createHmac("sha256", this.merchantKey)
      .update(hashStr)
      .digest("base64")

    // Constant-time comparison to prevent timing attacks
    try {
      const hashBuffer = Buffer.from(hash, 'utf-8')
      const expectedHashBuffer = Buffer.from(expectedHash, 'utf-8')

      return crypto.timingSafeEqual(
        hashBuffer as unknown as NodeJS.ArrayBufferView,
        expectedHashBuffer as unknown as NodeJS.ArrayBufferView
      )
    } catch {
      // Fallback: simple string comparison (less secure but works)
      return hash === expectedHash
    }
  }

  /**
   * Parse callback POST data
   */
  static parseCallback(body: URLSearchParams): PayTRCallbackData {
    return {
      merchant_oid: body.get("merchant_oid") || "",
      status: body.get("status") || "",
      total_amount: body.get("total_amount") || "",
      hash: body.get("hash") || "",
      failed_reason_code: body.get("failed_reason_code") || undefined,
      failed_reason_msg: body.get("failed_reason_msg") || undefined,
      test_mode: body.get("test_mode") || "0",
      payment_type: body.get("payment_type") || "",
      currency: body.get("currency") || "TL",
      installment_count: body.get("installment_count") || undefined,
    }
  }

  /**
   * Check if PayTR is in test mode
   */
  isTest(): boolean {
    return this.isTestMode
  }

  /**
   * Get merchant ID
   */
  getMerchantId(): string {
    return this.merchantId
  }
}
