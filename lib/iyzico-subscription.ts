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

export class IyzicoSubscriptionService {
  private config: SubscriptionConfig

  constructor(config: SubscriptionConfig) {
    this.config = config
  }

  /**
   * iyzico authorization header oluştur
   */
  private generateAuthString(uri: string, body: string): string {
    const randomString = crypto.randomBytes(16).toString("hex")
    const dataToEncrypt = randomString + uri + body
    const hash = crypto.createHmac("sha256", this.config.secretKey).update(dataToEncrypt).digest("base64")
    const authString = `apiKey:${this.config.apiKey}&randomKey:${randomString}&signature:${hash}`
    return `IYZWSv2 ${Buffer.from(authString).toString("base64")}`
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
        gsmNumber: billingInfo.phone,
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

    console.log("[v0] Sending subscription request to iyzico")

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
    console.log("[v0] iyzico response:", result)

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
}
