import crypto from "crypto"

export const SHOPIER_CHECKOUT_URLS: Record<string, string> = {
  "premium-yearly": "https://www.shopier.com/kreditakip/47811718",
  "premium-monthly": "https://www.shopier.com/kreditakip/47811704",
  "pro-yearly": "https://www.shopier.com/kreditakip/47811692",
  "pro-monthly": "https://www.shopier.com/kreditakip/47811671",
}

// Maps Shopier product ID (from URL slug) to our internal plan ID
export const SHOPIER_PRODUCT_PLAN_MAP: Record<string, string> = {
  "47811718": "premium-yearly",
  "47811704": "premium-monthly",
  "47811692": "pro-yearly",
  "47811671": "pro-monthly",
}

export interface ShopierOSBPayload {
  email: string
  orderid: string | number
  currency: string | number  // 0=TL, 1=USD, 2=EUR
  price: string
  buyername: string
  buyersurname: string
  productcount: number
  productid: string | number
  productlist: unknown[]
  chartdetails?: unknown
  customernote?: string
  istest: 0 | 1  // 0=canlı, 1=test
}

/**
 * Verifies Shopier OSB notification authenticity.
 * Hash: HMAC-SHA256(encodedPayload + OSB_USERNAME, key=OSB_PASSWORD)
 */
export function verifyShopierOSB(encodedPayload: string, receivedHash: string): boolean {
  try {
    const username = process.env.SHOPIER_OSB_USERNAME
    const password = process.env.SHOPIER_OSB_PASSWORD

    if (!username || !password) {
      console.error("[Shopier] Missing SHOPIER_OSB_USERNAME/PASSWORD env vars")
      return false
    }

    const expectedHash = crypto
      .createHmac("sha256", password)
      .update(encodedPayload + username)
      .digest("hex")

    const a = new Uint8Array(Buffer.from(expectedHash, "hex"))
    const b = new Uint8Array(Buffer.from(receivedHash, "hex"))
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function decodeShopierPayload(encodedPayload: string): ShopierOSBPayload {
  const decoded = Buffer.from(encodedPayload, "base64").toString("utf8")
  return JSON.parse(decoded)
}

export function getPlanIdFromProductId(productId: string): string | null {
  // productId may come as number or string; normalize to string
  return SHOPIER_PRODUCT_PLAN_MAP[String(productId)] ?? null
}

export function getCheckoutUrl(planId: string): string | null {
  return SHOPIER_CHECKOUT_URLS[planId] ?? null
}
