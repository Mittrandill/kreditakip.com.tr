// iyzico Payment Integration
interface IyzicoConfig {
  apiKey: string
  secretKey: string
  baseUrl: string
}

interface IyzicoPaymentRequest {
  locale: string
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
  paymentId: string
  price: number
  paidPrice: number
  currency: string
  paymentStatus: string
  errorCode?: string
  errorMessage?: string
  checkoutFormContent?: string
  token?: string
  tokenExpireTime?: number
}

export class IyzicoClient {
  private config: IyzicoConfig

  constructor() {
    this.config = {
      apiKey: process.env.IYZICO_API_KEY || "",
      secretKey: process.env.IYZICO_SECRET_KEY || "",
      baseUrl: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    }
  }

  private generateAuthString(url: string, body: string): string {
    const crypto = require("crypto")
    const randomString = this.generateRandomString()
    const dataToSign = randomString + url + body

    const hash = crypto.createHmac("sha256", this.config.secretKey).update(dataToSign).digest("base64")

    return `IYZWS ${this.config.apiKey}:${hash}:${randomString}`
  }

  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  async createCheckoutForm(request: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> {
    const url = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
    const body = JSON.stringify(request)

    const response = await fetch(`${this.config.baseUrl}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.generateAuthString(url, body),
        "x-iyzi-rnd": this.generateRandomString(),
      },
      body,
    })

    return response.json()
  }

  async retrieveCheckoutForm(token: string): Promise<IyzicoPaymentResponse> {
    const url = "/payment/iyzipos/checkoutform/auth/ecom/detail"
    const body = JSON.stringify({
      locale: "tr",
      token,
    })

    const response = await fetch(`${this.config.baseUrl}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.generateAuthString(url, body),
        "x-iyzi-rnd": this.generateRandomString(),
      },
      body,
    })

    return response.json()
  }

  async createSubscriptionPayment(
    userId: string,
    userEmail: string,
    userName: string,
    userSurname: string,
  ): Promise<IyzicoPaymentResponse> {
    const conversationId = `sub-${userId}-${Date.now()}`
    const price = "199.00"

    const request: IyzicoPaymentRequest = {
      locale: "tr",
      conversationId,
      price,
      paidPrice: price,
      currency: "TRY",
      basketId: `basket-${userId}`,
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
      billingAddress: {
        contactName: `${userName} ${userSurname}`,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      basketItems: [
        {
          id: "premium-subscription",
          name: "Premium Üyelik - Aylık",
          category1: "Subscription",
          itemType: "VIRTUAL",
          price,
        },
      ],
    }

    return this.createCheckoutForm(request)
  }
}

export const iyzicoClient = new IyzicoClient()
