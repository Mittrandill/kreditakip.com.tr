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

interface IyzicoDirectPaymentRequest extends Omit<IyzicoPaymentRequest, "callbackUrl"> {
  installment: number
  paymentChannel: string
  paymentCard: {
    cardHolderName: string
    cardNumber: string
    expireMonth: string
    expireYear: string
    cvc: string
    registerCard: number
  }
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
  paymentId?: string
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

  private async generateAuthString(randomString: string, uri: string, body: string): Promise<string> {
    const dataToEncrypt = randomString + uri + body

    // Convert string to Uint8Array
    const encoder = new TextEncoder()
    const keyData = encoder.encode(this.config.secretKey)
    const messageData = encoder.encode(dataToEncrypt)

    // Import key for HMAC
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])

    // Generate HMAC
    const signature = await crypto.subtle.sign("HMAC", key, messageData)

    // Convert to base64
    const hashArray = Array.from(new Uint8Array(signature))
    const hashBase64 = btoa(String.fromCharCode(...hashArray))

    return `IYZIWS ${this.config.apiKey}:${hashBase64}`
  }

  private generateRandomString(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  async initializeCheckoutForm(request: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> {
    const uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
    const body = JSON.stringify(request)
    const randomString = this.generateRandomString()

      baseUrl: this.config.baseUrl,
      hasApiKey: !!this.config.apiKey,
      hasSecretKey: !!this.config.secretKey,
      apiKeyLength: this.config.apiKey.length,
      secretKeyLength: this.config.secretKey.length,
      randomString: randomString,
    })

    if (!this.config.apiKey || !this.config.secretKey) {
      throw new Error("iyzico API credentials are not configured")
    }

    try {
      const authHeader = await this.generateAuthString(randomString, uri, body)

        uri,
        authHeaderPrefix: authHeader.substring(0, 20),
        randomStringLength: randomString.length,
        requestBodyPreview: body.substring(0, 100),
      })

      const response = await fetch(`${this.config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "x-iyzi-rnd": randomString,
          Accept: "application/json",
        },
        body: body,
      })


      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] iyzico HTTP error:", response.status, errorText)
        throw new Error(`iyzico API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()

        status: data.status,
        hasToken: !!data.token,
        hasCheckoutFormContent: !!data.checkoutFormContent,
        hasPaymentPageUrl: !!data.paymentPageUrl,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      })

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
    const uri = "/payment/iyzipos/checkoutform/auth/ecom/detail"
    const body = JSON.stringify({
      locale: "tr",
      conversationId: token,
      token: token,
    })
    const randomString = this.generateRandomString()

    try {
      const authHeader = await this.generateAuthString(randomString, uri, body)

      const response = await fetch(`${this.config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
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

  async createPayment(request: IyzicoDirectPaymentRequest): Promise<IyzicoPaymentResponse> {
    const uri = "/payment/auth"
    const body = JSON.stringify(request)
    const randomString = this.generateRandomString()


    if (!this.config.apiKey || !this.config.secretKey) {
      throw new Error("iyzico API credentials are not configured")
    }

    try {
      const authHeader = await this.generateAuthString(randomString, uri, body)

      const response = await fetch(`${this.config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "x-iyzi-rnd": randomString,
          Accept: "application/json",
        },
        body: body,
      })


      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] iyzico HTTP error:", response.status, errorText)
        throw new Error(`iyzico API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()

        status: data.status,
        paymentId: data.paymentId,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      })

      return data
    } catch (error) {
      console.error("[v0] iyzico payment error:", error)
      throw error
    }
  }

  async createDirectPayment(request: IyzicoDirectPaymentRequest): Promise<any> {
    const uri = "/payment/auth"
    const body = JSON.stringify(request)
    const randomString = this.generateRandomString()


    if (!this.config.apiKey || !this.config.secretKey) {
      throw new Error("iyzico API credentials are not configured")
    }

    try {
      const authHeader = await this.generateAuthString(randomString, uri, body)

      const response = await fetch(`${this.config.baseUrl}${uri}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "x-iyzi-rnd": randomString,
          Accept: "application/json",
        },
        body: body,
      })


      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] iyzico HTTP error:", response.status, errorText)
        throw new Error(`iyzico API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()

        status: data.status,
        paymentId: data.paymentId,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      })

      return data
    } catch (error) {
      console.error("[v0] iyzico direct payment error:", error)
      throw error
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
        identityNumber: "11111111111",
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

  createDirectPaymentRequest(
    userId: string,
    userEmail: string,
    userName: string,
    userSurname: string,
    cardDetails: {
      cardHolderName: string
      cardNumber: string
      expireMonth: string
      expireYear: string
      cvc: string
    },
    billingAddress: {
      address: string
      city: string
      zipCode: string
    },
  ): IyzicoDirectPaymentRequest {
    const conversationId = `sub_${userId}_${Date.now()}`

    return {
      locale: "tr",
      conversationId: conversationId,
      price: "199.00",
      paidPrice: "199.00",
      currency: "TRY",
      installment: 1,
      basketId: conversationId,
      paymentChannel: "WEB",
      paymentGroup: "SUBSCRIPTION",
      paymentCard: {
        cardHolderName: cardDetails.cardHolderName,
        cardNumber: cardDetails.cardNumber.replace(/\s/g, ""),
        expireMonth: cardDetails.expireMonth,
        expireYear: cardDetails.expireYear,
        cvc: cardDetails.cvc,
        registerCard: 0,
      },
      buyer: {
        id: userId,
        name: userName,
        surname: userSurname,
        email: userEmail,
        identityNumber: "11111111111",
        registrationAddress: billingAddress.address,
        city: billingAddress.city,
        country: "Turkey",
      },
      shippingAddress: {
        contactName: `${userName} ${userSurname}`,
        city: billingAddress.city,
        country: "Turkey",
        address: billingAddress.address,
      },
      billingAddress: {
        contactName: `${userName} ${userSurname}`,
        city: billingAddress.city,
        country: "Turkey",
        address: billingAddress.address,
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
export type { IyzicoPaymentRequest, IyzicoPaymentResponse, IyzicoDirectPaymentRequest }
