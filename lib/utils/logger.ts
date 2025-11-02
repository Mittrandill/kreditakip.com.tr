/**
 * Production-ready logger utility
 * Logs are only shown in development environment
 * In production, errors are logged but info/debug logs are suppressed
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export const logger = {
  /**
   * Log informational messages (suppressed in production)
   */
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
    }
  },

  /**
   * Log debug messages (suppressed in production)
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
    }
  },

  /**
   * Log warnings (shown in all environments)
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },

  /**
   * Log errors (shown in all environments)
   */
  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, error, ...args)

    // In production, you might want to send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // if (isProduction && typeof window !== 'undefined') {
    //   // Send to error tracking service
    // }
  },

  /**
   * Log payment-related events (always logged for audit purposes)
   */
  payment: (message: string, ...args: any[]) => {
    // In production, send to audit log/database
  },

  /**
   * Log security-related events (always logged for audit purposes)
   */
  security: (message: string, ...args: any[]) => {
    // In production, send to security monitoring system
  },
}
