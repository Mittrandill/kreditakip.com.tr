// iyzico Subscription Service using REST API (Next.js 14 compatible)
import crypto from "crypto"

export interface SubscriptionConfig {
  apiKey: string
  secretKey: string
  uri: string
}

export interface BillingInfo {
  fullName: string
  email: string
  phone: string
  identityNumber: string
  address: string
  city: string
  district: string
  zipCode: string
  taxNumber?: string
  taxOffice?: string
}

export interface CardInfo {
  cardHolderName: string
  cardNumber: string
  expireMonth: string
  expireYear: string
  cvc: string
}

export class IyzipaySubscriptionClient {
  private config: SubscriptionConfig

  constructor(config: SubscriptionConfig) {
    this.config = config
  }

  /**
   * iyzico authorization header oluştur (IYZWSv2 format)
   * Resmi iyzipay paketinin utils.generateHashV2 metodunu taklit eder
   */
  private generateAuthString(uri: string, body: string): string {
    const randomString = crypto.randomBytes(16).toString("hex")

    // KRİTİK: Signature HEX formatında olmalı (base64 değil!)
    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(randomString + uri + body)
      .digest("hex") // <-- HEX olmalı!

    // Authorization parametrelerini array olarak oluştur ve join ile birleştir
    const separator = ":"
    const authorizationParams = [
      `apiKey${separator}${this.config.apiKey}`,
      `randomKey${separator}${randomString}`,
      `signature${separator}${signature}`,
    ]

    return `IYZWSv2 ${Buffer.from(authorizationParams.join("&")).toString("base64")}`
  }

  /**
   * Abonelik başlatma
   */
  async initializeSubscription(
    productReferenceCode: string,
    pricingPlanReferenceCode: string,
    billingInfo: BillingInfo,
    cardInfo: CardInfo,
  ): Promise<any> {
    const uri = "/v2/subscription/initialize"
    const url = `${this.config.uri}${uri}`

    const [firstName, ...lastNameParts] = billingInfo.fullName.split(" ")
    const lastName = lastNameParts.join(" ") || firstName

    // Telefon numarasını formatla (başında 0 varsa +90 ile değiştir)
    const formattedPhone = billingInfo.phone.startsWith("0")
      ? "+90" + billingInfo.phone.substring(1)
      : billingInfo.phone.startsWith("+")
        ? billingInfo.phone
        : "+90" + billingInfo.phone

    const requestBody = {
      locale: "tr",
      conversationId: `sub_${Date.now()}`,
      productReferenceCode,
      pricingPlanReferenceCode,
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name: firstName,
        surname: lastName,
        email: billingInfo.email,
        gsmNumber: formattedPhone,
        identityNumber: billingInfo.identityNumber,
        shippingContactName: billingInfo.fullName,
        shippingCity: billingInfo.city,
        shippingDistrict: billingInfo.district,
        shippingCountry: "Turkey",
        shippingAddress: billingInfo.address,
        shippingZipCode: billingInfo.zipCode,
        billingContactName: billingInfo.fullName,
        billingCity: billingInfo.city,
        billingDistrict: billingInfo.district,
        billingCountry: "Turkey",
        billingAddress: billingInfo.address,
        billingZipCode: billingInfo.zipCode,
      },
      paymentCard: {
        cardHolderName: cardInfo.cardHolderName,
        cardNumber: cardInfo.cardNumber.replace(/\s/g, ""),
        expireMonth: cardInfo.expireMonth,
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc,
      },
    }

    const body = JSON.stringify(requestBody)
    const authString = this.generateAuthString(uri, body)

    console.log("[iyzipay] Sending subscription request to:", url)
    console.log("[iyzipay] Request body (FULL):", JSON.stringify(requestBody, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authString,
        "x-iyzi-rnd": crypto.randomBytes(16).toString("hex"),
      },
      body,
    })

    const result = await response.json()

    console.log("[iyzipay] Subscription response (FULL):", JSON.stringify(result, null, 2))
    console.log("[iyzipay] Response status code:", response.status)

    if (!response.ok && !result.status) {
      throw new Error(`iyzico API error: ${result.errorMessage || response.statusText}`)
    }

    return result
  }

  /**
   * Abonelik durumunu sorgula
   */
  async retrieveSubscription(subscriptionReferenceCode: string): Promise<any> {
    const uri = "/v2/subscription/retrieve"
    const url = `${this.config.uri}${uri}`

    const requestBody = {
      locale: "tr",
      conversationId: `retrieve_${Date.now()}`,
      subscriptionReferenceCode,
    }

    const body = JSON.stringify(requestBody)
    const authString = this.generateAuthString(uri, body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authString,
        "x-iyzi-rnd": crypto.randomBytes(16).toString("hex"),
      },
      body,
    })

    return await response.json()
  }

  /**
   * Aboneliği iptal et
   */
  async cancelSubscription(subscriptionReferenceCode: string): Promise<any> {
    const uri = "/v2/subscription/cancel"
    const url = `${this.config.uri}${uri}`

    const requestBody = {
      locale: "tr",
      conversationId: `cancel_${Date.now()}`,
      subscriptionReferenceCode,
    }

    const body = JSON.stringify(requestBody)
    const authString = this.generateAuthString(uri, body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authString,
        "x-iyzi-rnd": crypto.randomBytes(16).toString("hex"),
      },
      body,
    })

    return await response.json()
  }

  /**
   * Normal ödeme al (tek seferlik)
   * Carion.com.tr'deki gibi subscription için normal payment kullan
   */
  async createPayment(
    userId: string,
    billingInfo: BillingInfo,
    cardInfo: CardInfo,
    price: string,
  ): Promise<any> {
    const uri = "/payment/auth"
    const url = `${this.config.uri}${uri}`

    const [firstName, ...lastNameParts] = billingInfo.fullName.split(" ")
    const lastName = lastNameParts.join(" ") || firstName

    // Telefon numarasını formatla
    const formattedPhone = billingInfo.phone.startsWith("0")
      ? "+90" + billingInfo.phone.substring(1)
      : billingInfo.phone.startsWith("+")
        ? billingInfo.phone
        : "+90" + billingInfo.phone

    const conversationId = `sub_${userId}_${Date.now()}`

    const requestBody = {
      locale: "tr",
      conversationId,
      price,
      paidPrice: price,
      currency: "TRY",
      installment: 1,
      basketId: `B${Date.now()}`,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      paymentCard: {
        cardHolderName: cardInfo.cardHolderName,
        cardNumber: cardInfo.cardNumber.replace(/\s/g, ""),
        expireMonth: cardInfo.expireMonth.padStart(2, "0"),
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc,
        registerCard: 0,
      },
      buyer: {
        id: userId,
        name: firstName,
        surname: lastName,
        email: billingInfo.email,
        gsmNumber: formattedPhone,
        identityNumber: billingInfo.identityNumber,
        registrationAddress: billingInfo.address,
        city: billingInfo.city,
        country: "Turkey",
        ip: "85.34.78.112",
      },
      shippingAddress: {
        contactName: billingInfo.fullName,
        city: billingInfo.city,
        country: "Turkey",
        address: billingInfo.address,
        zipCode: billingInfo.zipCode,
      },
      billingAddress: {
        contactName: billingInfo.fullName,
        city: billingInfo.city,
        country: "Turkey",
        address: billingInfo.address,
        zipCode: billingInfo.zipCode,
      },
      basketItems: [
        {
          id: "premium_sub_001",
          name: "Premium Üyelik (Aylık)",
          category1: "Subscription",
          itemType: "VIRTUAL",
          price,
        },
      ],
    }

    const body = JSON.stringify(requestBody)
    const authString = this.generateAuthString(uri, body)

    console.log("[iyzipay] Creating payment (normal API)")
    console.log("[iyzipay] Payment request to:", url)
    console.log("[iyzipay] Amount:", price, "TRY")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authString,
        "x-iyzi-rnd": crypto.randomBytes(16).toString("hex"),
      },
      body,
    })

    const result = await response.json()

    console.log("[iyzipay] Payment response:", {
      status: result.status,
      paymentId: result.paymentId,
      conversationId: result.conversationId,
      errorMessage: result.errorMessage,
      errorCode: result.errorCode,
    })

    return result
  }
}
