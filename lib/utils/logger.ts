/**
 * Production-ready logger utility
 * Provides structured logging with different levels
 * In production, info/debug logs are suppressed, errors/warnings always logged
 */

type LogLevel = 'info' | 'debug' | 'warn' | 'error' | 'payment' | 'security'

interface LogMetadata {
  [key: string]: any
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Format log entry with timestamp and metadata
 */
const formatLog = (level: LogLevel, message: string, metadata?: LogMetadata): string => {
  const timestamp = new Date().toISOString()
  const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataStr}`
}

export const logger = {
  /**
   * Log informational messages (suppressed in production)
   */
  info: (message: string, metadata?: LogMetadata) => {
    if (isDevelopment) {
      console.info(formatLog('info', message, metadata))
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, metadata?: LogMetadata) => {
    if (isDevelopment) {
      console.debug(formatLog('debug', message, metadata))
    }
  },

  /**
   * Log warnings (shown in all environments)
   */
  warn: (message: string, metadata?: LogMetadata) => {
    console.warn(formatLog('warn', message, metadata))
  },

  /**
   * Log errors (shown in all environments)
   */
  error: (message: string, error?: any, metadata?: LogMetadata) => {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        error: error.message || error.toString(),
        stack: error.stack,
      }),
    }
    console.error(formatLog('error', message, errorMetadata))

    // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
    // if (isProduction && typeof window !== 'undefined') {
    //   captureException(error, { extra: metadata })
    // }
  },

  /**
   * Log payment-related events (always logged for audit purposes)
   */
  payment: (message: string, metadata?: LogMetadata) => {
    console.log(formatLog('payment', message, metadata))
    // TODO: In production, send to audit log/database
  },

  /**
   * Log security-related events (always logged for audit purposes)
   */
  security: (message: string, metadata?: LogMetadata) => {
    console.warn(formatLog('security', message, metadata))
    // TODO: In production, send to security monitoring system
  },
}
