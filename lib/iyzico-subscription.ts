import Iyzipay from "iyzipay"

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
  private iyzipay: any

  constructor(config: SubscriptionConfig) {
    this.iyzipay = new Iyzipay({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      uri: config.uri,
    })
  }

  /**
   * Abonelik başlatma
   * @param productReferenceCode - iyzico panelinden alınan ürün referans kodu
   * @param pricingPlanReferenceCode - iyzico panelinden alınan plan referans kodu
   * @param billingInfo - Fatura bilgileri
   * @param cardInfo - Kart bilgileri
   */
  async initializeSubscription(
    productReferenceCode: string,
    pricingPlanReferenceCode: string,
    billingInfo: BillingInfo,
    cardInfo: CardInfo,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `sub_${Date.now()}`,
        productReferenceCode,
        pricingPlanReferenceCode,
        subscriptionInitialStatus: "ACTIVE", // Hemen başlat (deneme süresi yoksa)
        customer: {
          name: billingInfo.fullName.split(" ")[0],
          surname: billingInfo.fullName.split(" ").slice(1).join(" "),
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

      console.log("[v0] Initializing subscription with request:", {
        ...request,
        paymentCard: { ...request.paymentCard, cardNumber: "****", cvc: "***" },
      })

      this.iyzipay.subscriptionCheckoutForm.initialize(request, (err: any, result: any) => {
        if (err) {
          console.error("[v0] Subscription initialization error:", err)
          reject(err)
        } else {
          console.log("[v0] Subscription initialized:", result)
          resolve(result)
        }
      })
    })
  }

  /**
   * Abonelik durumunu sorgula
   */
  async retrieveSubscription(subscriptionReferenceCode: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `retrieve_${Date.now()}`,
        subscriptionReferenceCode,
      }

      this.iyzipay.subscription.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Aboneliği iptal et
   */
  async cancelSubscription(subscriptionReferenceCode: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `cancel_${Date.now()}`,
        subscriptionReferenceCode,
      }

      this.iyzipay.subscription.cancel(request, (err: any, result: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}
