import { headers } from "next/headers"
import type { NextRequest } from "next/server"

/**
 * Security Utilities for Payment Fraud Detection
 *
 * These utilities help track IP addresses, device fingerprints,
 * and calculate risk scores for payment transactions.
 */

export interface DeviceInfo {
  fingerprint: string
  userAgent: string
  browser: string
  os: string
  device: string
  screenResolution?: string
  timezone?: string
  language?: string
}

export interface SecurityContext {
  ipAddress: string
  userAgent: string
  deviceFingerprint?: string
  browserInfo: {
    browser: string
    os: string
    device: string
  }
  timestamp: string
}

/**
 * Get client IP address from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: NextRequest | Request): string {
  // Try various headers in order of preference
  const headersList = headers()

  // Vercel-specific header
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim()
  }

  // Cloudflare
  const cfConnectingIp = headersList.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Other proxy headers
  const realIp = headersList.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Fallback - this might be the proxy IP in production
  return "unknown"
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request?: NextRequest | Request): string {
  const headersList = headers()
  return headersList.get("user-agent") || "unknown"
}

/**
 * Parse user agent to extract browser, OS, and device info
 */
export function parseUserAgent(userAgent: string): {
  browser: string
  os: string
  device: string
} {
  // Simple user agent parsing (you can use a library like 'ua-parser-js' for more accuracy)
  let browser = "Unknown"
  let os = "Unknown"
  let device = "Desktop"

  // Detect browser
  if (userAgent.includes("Chrome")) browser = "Chrome"
  else if (userAgent.includes("Firefox")) browser = "Firefox"
  else if (userAgent.includes("Safari")) browser = "Safari"
  else if (userAgent.includes("Edge")) browser = "Edge"
  else if (userAgent.includes("Opera")) browser = "Opera"

  // Detect OS
  if (userAgent.includes("Windows")) os = "Windows"
  else if (userAgent.includes("Mac OS")) os = "macOS"
  else if (userAgent.includes("Linux")) os = "Linux"
  else if (userAgent.includes("Android")) os = "Android"
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS"

  // Detect device type
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "Mobile"
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) device = "Tablet"

  return { browser, os, device }
}

/**
 * Get full security context from request
 */
export function getSecurityContext(request: NextRequest | Request): SecurityContext {
  const ipAddress = getClientIp(request)
  const userAgent = getUserAgent(request)
  const browserInfo = parseUserAgent(userAgent)

  return {
    ipAddress,
    userAgent,
    browserInfo,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Generate a simple hash for device fingerprinting
 * In production, use a client-side library like FingerprintJS
 */
export function generateDeviceFingerprint(
  ipAddress: string,
  userAgent: string,
  additionalData?: Record<string, any>
): string {
  const data = {
    ip: ipAddress,
    ua: userAgent,
    ...additionalData,
  }

  // Simple hash - in production, use a proper library
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Check if IP address is from a known VPN/Proxy
 * This is a simplified version - use a service like IPQualityScore or MaxMind in production
 */
export async function isVpnOrProxy(ipAddress: string): Promise<boolean> {
  // TODO: Integrate with VPN detection service
  // For now, return false
  return false
}

/**
 * Calculate risk score based on various factors
 */
export interface RiskFactors {
  isNewUser?: boolean // User registered < 7 days ago
  isInactiveUser?: boolean // User hasn't logged in for 30+ days
  hasMultipleFailedPayments?: boolean // Multiple failed payments recently
  isHighAmount?: boolean // Payment amount > threshold
  isVpnDetected?: boolean // VPN or proxy detected
  hasIpLocationMismatch?: boolean // IP location differs from billing
  hasMultipleCardsFromSameIp?: boolean // Multiple cards from same IP
  userRegisteredDaysAgo?: number
  daysSinceLastLogin?: number
  failedPaymentCount?: number
  paymentAmount?: number
}

export function calculateRiskScore(factors: RiskFactors): {
  score: number
  flags: string[]
  level: "low" | "medium" | "high" | "critical"
} {
  let score = 0
  const flags: string[] = []

  // New user risk
  if (factors.isNewUser && factors.userRegisteredDaysAgo && factors.userRegisteredDaysAgo < 7) {
    if (factors.paymentAmount && factors.paymentAmount > 500) {
      score += 20
      flags.push("new_user_large_payment")
    } else {
      score += 10
      flags.push("new_user")
    }
  }

  // Inactive user risk
  if (factors.isInactiveUser) {
    score += 25
    flags.push("inactive_user_payment")
  }

  // Failed payment attempts
  if (factors.hasMultipleFailedPayments) {
    score += 30
    flags.push("multiple_failed_attempts")
  }

  // High amount
  if (factors.isHighAmount && factors.paymentAmount && factors.paymentAmount > 1000) {
    score += 15
    flags.push("high_amount")
  }

  // VPN detection
  if (factors.isVpnDetected) {
    score += 15
    flags.push("vpn_detected")
  }

  // IP location mismatch
  if (factors.hasIpLocationMismatch) {
    score += 10
    flags.push("ip_location_mismatch")
  }

  // Multiple cards from same IP
  if (factors.hasMultipleCardsFromSameIp) {
    score += 20
    flags.push("multiple_cards_same_ip")
  }

  // Determine risk level
  let level: "low" | "medium" | "high" | "critical"
  if (score >= 50) level = "critical"
  else if (score >= 30) level = "high"
  else if (score >= 15) level = "medium"
  else level = "low"

  return { score, flags, level }
}

/**
 * Log security event to database
 */
export async function logSecurityEvent(
  supabase: any,
  event: {
    userId: string
    paymentId?: string
    eventType: "payment_attempt" | "payment_success" | "payment_failed" | "suspicious_activity"
    ipAddress: string
    userAgent: string
    deviceFingerprint?: string
    browserInfo?: any
    locationInfo?: any
    riskScore?: number
    riskFactors?: string[]
    sessionId?: string
    metadata?: any
  }
) {
  const { error } = await supabase.from("payment_security_logs").insert({
    user_id: event.userId,
    payment_id: event.paymentId,
    event_type: event.eventType,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    device_fingerprint: event.deviceFingerprint,
    browser_info: event.browserInfo || {},
    location_info: event.locationInfo || {},
    risk_score: event.riskScore || 0,
    risk_factors: event.riskFactors || [],
    session_id: event.sessionId,
    metadata: event.metadata || {},
  })

  if (error) {
    console.error("[Security] Failed to log security event:", error)
  }
}

/**
 * Get user's recent payment activity for fraud detection
 */
export async function getUserPaymentActivity(
  supabase: any,
  userId: string,
  hoursBack: number = 24
) {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - hoursBack)

  const { data: payments, error } = await supabase
    .from("paytr_recurring_payments")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", cutoffTime.toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Security] Failed to get user payment activity:", error)
    return []
  }

  return payments || []
}

/**
 * Check for suspicious patterns
 */
export async function detectSuspiciousActivity(
  supabase: any,
  userId: string,
  ipAddress: string
): Promise<{
  isSuspicious: boolean
  reasons: string[]
}> {
  const reasons: string[] = []

  // Check for multiple failed payments in last 24 hours
  const recentPayments = await getUserPaymentActivity(supabase, userId, 24)
  const failedCount = recentPayments.filter((p: any) => p.payment_status === "failed").length

  if (failedCount >= 3) {
    reasons.push("Multiple failed payment attempts in last 24 hours")
  }

  // Check for multiple different users from same IP
  const { count: usersFromSameIp } = await supabase
    .from("paytr_recurring_payments")
    .select("user_id", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (usersFromSameIp && usersFromSameIp > 3) {
    reasons.push("Multiple users from same IP address")
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  }
}
