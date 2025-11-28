import crypto from "crypto"

export interface PaddlePrice {
  product_id: string
  product_title: string
  description?: string
  currency: string
  amount: number
  tax_rate?: number
  status: "active" | "archived"
}

export interface PaddleProduct {
  id: string
  name: string
  description?: string
  type: "standard" | "subscription"
  tax_category: string
  prices: PaddlePrice[]
}

export interface PaddleCustomer {
  id: string
  email: string
  name?: string
  country?: string
  postcode?: string
  created_at: string
}

export interface PaddleSubscription {
  id: string
  customer_id: string
  plan_id: string
  status: "active" | "trialing" | "paused" | "canceled" | "past_due"
  current_period_start: string
  current_period_end: string
  next_payment_date?: string
  pause_date?: string
  canceled_at?: string
  currency: string
  amount: number
  payment_method?: string
  checkout?: {
    url: string
  }
  management_urls?: {
    manage: string
    cancel: string
    update_payment: string
  }
}

export interface PaddleCheckoutOptions {
  items: Array<{
    price_id: string
    quantity: number
  }>
  customer_email?: string
  custom_data?: Record<string, any>
  success_url?: string
  cancel_url?: string
  passthrough?: string
}

export class PaddleClient {
  private vendorId: string
  private vendorAuthCode: string
  private apiKey: string
  private isTest: boolean

  constructor() {
    this.vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID!
    this.vendorAuthCode = process.env.PADDLE_VENDOR_AUTH_CODE!
    this.apiKey = process.env.PADDLE_API_KEY!
    this.isTest = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
  }

  private getBaseUrl(): string {
    return this.isTest
      ? "https://sandbox-api.paddle.com"
      : "https://api.paddle.com"
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.detail || `Paddle API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create or update a customer in Paddle
   */
  async createOrUpdateCustomer(
    email: string,
    name?: string,
    country?: string,
    postcode?: string
  ): Promise<PaddleCustomer> {
    const response = await this.makeRequest("/customers", {
      method: "POST",
      body: JSON.stringify({
        email,
        name,
        country,
        postcode,
      }),
    })

    return response.data
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<PaddleCustomer> {
    const response = await this.makeRequest(`/customers/${customerId}`)
    return response.data
  }

  /**
   * Create a checkout link for subscription
   */
  async createCheckoutLink(options: PaddleCheckoutOptions): Promise<{ url: string; id: string }> {
    const response = await this.makeRequest("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        items: options.items,
        customer_email: options.customer_email,
        custom_data: options.custom_data,
        success_url: options.success_url,
        cancel_url: options.cancel_url,
        passthrough: options.passthrough,
      }),
    })

    return {
      url: response.data.url,
      id: response.data.id,
    }
  }

  /**
   * Create a subscription from a checkout
   */
  async createSubscription(checkoutId: string): Promise<PaddleSubscription> {
    const response = await this.makeRequest(`/checkouts/${checkoutId}/preview`)
    return response.data.subscription
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<PaddleSubscription> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`)
    return response.data
  }

  /**
   * Update subscription (pause, resume, change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      pause?: { mode: "fixed" | "variable"; resumes_at?: string }
      resume?: boolean
      items?: Array<{
        price_id: string
        quantity: number
      }>
    }
  ): Promise<PaddleSubscription> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })

    return response.data
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    options?: {
      effective_from: "immediately" | "next_billing_period"
    }
  ): Promise<PaddleSubscription> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    })

    return response.data
  }

  /**
   * Get a list of products with prices
   */
  async getProducts(): Promise<PaddleProduct[]> {
    const response = await this.makeRequest("/products")
    return response.data
  }

  /**
   * Get subscription management URLs
   */
  async getSubscriptionManagementUrls(subscriptionId: string): Promise<{
    manage: string
    cancel: string
    update_payment: string
  }> {
    const subscription = await this.getSubscription(subscriptionId)
    return subscription.management_urls || {
      manage: "",
      cancel: "",
      update_payment: "",
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const verifier = crypto.createVerify("sha256")
      verifier.update(payload)
      return verifier.verify(publicKey, signature, "base64")
    } catch (error) {
      console.error("[Paddle] Webhook signature verification failed:", error)
      return false
    }
  }

  /**
   * Generate passthrough data for checkout
   */
  static generatePassthrough(userId: string, planId: string, metadata?: any): string {
    return JSON.stringify({
      userId,
      planId,
      timestamp: Date.now(),
      ...metadata,
    })
  }

  /**
   * Parse passthrough data
   */
  static parsePassthrough(passthrough: string): {
    userId: string
    planId: string
    timestamp: number
    metadata?: any
  } | null {
    try {
      return JSON.parse(passthrough)
    } catch (error) {
      console.error("[Paddle] Failed to parse passthrough data:", error)
      return null
    }
  }
}

// Singleton instance
export const paddleClient = new PaddleClient()