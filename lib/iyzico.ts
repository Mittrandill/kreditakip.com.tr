// iyzico Payment Integration
// Documentation: https://dev.iyzipay.com/

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
  private config: IyzicoConfig

  constructor() {
    this.config = {
      apiKey: process.env.IYZICO_API_KEY || "",
      secretKey: process.env.IYZICO_SECRET_KEY || "",
      baseUrl: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    }
  }

  private generateAuthString(uri: string, body: string): string {
    const crypto = require("crypto")
    const randomString = this.generateRandomString()
    const dataToEncrypt = `${randomString}${uri}${body}`

    const hash = crypto.createHmac("sha256", this.config.secretKey).update(dataToEncrypt).digest("base64")

    return `IYZWS ${this.config.apiKey}:${hash}`
  }

  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  async initializeCheckoutForm(request: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> {
    const uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
    const body = JSON.stringify(request)

    try {
      const response = await fetch(`${this.config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.generateAuthString(uri, body),
          "x-iyzi-rnd": this.generateRandomString(),
        },
        body: body,
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] iyzico API error:", error)
      throw new Error("Payment initialization failed")
    }
  }

  async retrieveCheckoutForm(token: string): Promise<any> {
    const uri = "/payment/iyzipos/checkoutform/auth/ecom/detail"
    const body = JSON.stringify({
      locale: "tr",
      conversationId: token,
      token: token,
    })

    try {
      const response = await fetch(`${this.config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.generateAuthString(uri, body),
          "x-iyzi-rnd": this.generateRandomString(),
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
