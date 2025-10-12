// iyzico Payment Integration
// Documentation: https://dev.iyzipay.com/

import crypto from "crypto"

interface IyzicoConfig {
  apiKey: string
  secretKey: string
  baseUrl: string
}

interface IyzicoPaymentRequest {
  locale?: string
  conversationId: string
  price: string
  paidPrice: string
  currency: string
  basketId: string
  paymentGroup: string
  callbackUrl: string
  buyer: {
    id: string
    name: string
    surname: string
    email: string
    identityNumber: string
    registrationAddress: string
    city: string
    country: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  basketItems: Array<{
    id: string
    name: string
    category1: string
    itemType: string
    price: string
  }>
}

interface IyzicoPaymentResponse {
  status: string
  locale: string
  systemTime: number
  conversationId: string
  token?: string
  checkoutFormContent?: string
  tokenExpireTime?: number
  paymentPageUrl?: string
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

class IyzicoClient {
  private config: IyzicoConfig | null = null

  private getConfig(): IyzicoConfig {
    if (!this.config) {
      const apiKey = process.env.IYZICO_API_KEY
      const secretKey = process.env.IYZICO_SECRET_KEY
      const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com"

      if (!apiKey || !secretKey) {
        throw new Error(
          "iyzico credentials not configured. Please set IYZICO_API_KEY and IYZICO_SECRET_KEY environment variables.",
        )
      }

      this.config = {
        apiKey,
        secretKey,
        baseUrl,
      }
    }

    return this.config
  }

  private generateAuthString(randomString: string, uri: string, body: string): string {
    const config = this.getConfig()
    // iyzico expects: IYZIWS apiKey:base64(hmac_sha256(apiKey + randomString + secretKey + body))
    const dataToEncrypt = `${config.apiKey}${randomString}${config.secretKey}${body}`

    const hash = crypto.createHmac("sha256", config.secretKey).update(dataToEncrypt).digest("base64")

    return `IYZWSv2 ${config.apiKey}:${hash}`
  }

  private generateRandomString(): string {
    return crypto.randomBytes(16).toString("hex")
  }

  async initializeCheckoutForm(request: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> {
    const config = this.getConfig()
    const uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
    const body = JSON.stringify(request)
    const randomString = this.generateRandomString()

    console.log("[v0] Initializing iyzico payment with config:", {
      baseUrl: config.baseUrl,
      hasApiKey: !!config.apiKey,
      hasSecretKey: !!config.secretKey,
      apiKeyLength: config.apiKey.length,
      secretKeyLength: config.secretKey.length,
      randomString: randomString,
    })

    try {
      const authHeader = this.generateAuthString(randomString, uri, body)

      console.log("[v0] Request details:", {
        uri,
        authHeaderPrefix: authHeader.substring(0, 20),
        randomStringLength: randomString.length,
      })

      const response = await fetch(`${config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "x-iyzi-rnd": randomString,
          Accept: "application/json",
        },
        body: body,
      })

      console.log("[v0] iyzico response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] iyzico HTTP error:", response.status, errorText)
        throw new Error(`iyzico API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      console.log("[v0] iyzico response status:", data.status)

      if (data.status !== "success") {
        console.error("[v0] iyzico error:", data.errorMessage, data.errorCode)
      }

      return data
    } catch (error) {
      console.error("[v0] iyzico API error:", error)
      throw error
    }
  }

  async retrieveCheckoutForm(token: string): Promise<any> {
    const config = this.getConfig()
    const uri = "/payment/iyzipos/checkoutform/auth/ecom/detail"
    const body = JSON.stringify({
      locale: "tr",
      conversationId: token,
      token: token,
    })
    const randomString = this.generateRandomString()

    try {
      const response = await fetch(`${config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.generateAuthString(randomString, uri, body),
          "x-iyzi-rnd": randomString,
          Accept: "application/json",
        },
        body: body,
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] iyzico retrieve error:", error)
      throw new Error("Payment retrieval failed")
    }
  }

  createPremiumSubscriptionRequest(
    userId: string,
    userEmail: string,
    userName: string,
    userSurname: string,
  ): IyzicoPaymentRequest {
    const conversationId = `sub_${userId}_${Date.now()}`

    return {
      locale: "tr",
      conversationId: conversationId,
      price: "199.00",
      paidPrice: "199.00",
      currency: "TRY",
      basketId: conversationId,
      paymentGroup: "SUBSCRIPTION",
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback`,
      buyer: {
        id: userId,
        name: userName,
        surname: userSurname,
        email: userEmail,
        identityNumber: "11111111111", // This should be collected from user
        registrationAddress: "Türkiye",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: `${userName} ${userSurname}`,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      billingAddress: {
        contactName: `${userName} ${userSurname}`,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      basketItems: [
        {
          id: "premium_sub_001",
          name: "Premium Üyelik",
          category1: "Subscription",
          itemType: "VIRTUAL",
          price: "199.00",
        },
      ],
    }
  }
}

export const iyzicoClient = new IyzicoClient()
export type { IyzicoPaymentRequest, IyzicoPaymentResponse }
