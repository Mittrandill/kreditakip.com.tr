import { toast } from "sonner"

// Error types for categorization
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  VALIDATION = "VALIDATION",
  PERMISSION = "PERMISSION",
  SERVER = "SERVER",
  CLIENT = "CLIENT",
  UNKNOWN = "UNKNOWN",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Structured error interface
export interface AppError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  code?: string
  context?: Record<string, any>
  timestamp: Date
  userId?: string
  url?: string
  userAgent?: string
  stack?: string
}

// Error logging service
class ErrorLogger {
  private errors: AppError[] = []
  private maxErrors = 100

  log(error: AppError) {
    // Add to local storage
    this.errors.unshift(error)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.group(`🚨 [${error.severity}] ${error.type} Error`)
      console.error("Message:", error.message)
      console.error("User Message:", error.userMessage)
      console.error("Context:", error.context)
      console.error("Stack:", error.stack)
      console.groupEnd()
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoring(error)
    }
  }

  private async sendToMonitoring(error: AppError) {
    try {
      // Send to monitoring service (Sentry, LogRocket, etc.)
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(error),
      })
    } catch (err) {
      console.error("Failed to send error to monitoring:", err)
    }
  }

  getErrors(): AppError[] {
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
  }
}

export const errorLogger = new ErrorLogger()

// Error factory functions
export function createError(
  type: ErrorType,
  message: string,
  userMessage: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>,
): AppError {
  return {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    message,
    userMessage,
    context,
    timestamp: new Date(),
    userId: getCurrentUserId(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    stack: new Error().stack,
  }
}

function getCurrentUserId(): string | undefined {
  // Get user ID from auth context or localStorage
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user?.id
  } catch {
    return undefined
  }
}

// Error handling utilities
export function handleApiError(error: any, context?: Record<string, any>): AppError {
  let errorType = ErrorType.UNKNOWN
  let severity = ErrorSeverity.MEDIUM
  let userMessage = "Bir hata oluştu. Lütfen tekrar deneyin."

  // Categorize error based on status code or message
  if (error?.status || error?.response?.status) {
    const status = error.status || error.response.status

    if (status === 401 || status === 403) {
      errorType = ErrorType.AUTHENTICATION
      userMessage = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."
      severity = ErrorSeverity.HIGH
    } else if (status === 404) {
      errorType = ErrorType.CLIENT
      userMessage = "Aradığınız kaynak bulunamadı."
    } else if (status === 422) {
      errorType = ErrorType.VALIDATION
      userMessage = "Girdiğiniz bilgilerde hata var. Lütfen kontrol edin."
    } else if (status >= 500) {
      errorType = ErrorType.SERVER
      userMessage = "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin."
      severity = ErrorSeverity.HIGH
    } else if (status === 429) {
      errorType = ErrorType.CLIENT
      userMessage = "Çok fazla istek gönderdiniz. Lütfen bekleyin."
    }
  } else if (error?.message?.includes("fetch")) {
    errorType = ErrorType.NETWORK
    userMessage = "İnternet bağlantınızı kontrol edin."
    severity = ErrorSeverity.HIGH
  }

  const appError = createError(errorType, error?.message || "Unknown error", userMessage, severity, {
    ...context,
    originalError: error,
  })

  errorLogger.log(appError)
  return appError
}

// User-friendly error display
export function showErrorToast(error: AppError) {
  const toastOptions = {
    duration: error.severity === ErrorSeverity.CRITICAL ? 10000 : 5000,
  }

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      toast.error(error.userMessage, {
        ...toastOptions,
        description: "Bu kritik bir hata. Destek ekibiyle iletişime geçin.",
      })
      break
    case ErrorSeverity.HIGH:
      toast.error(error.userMessage, toastOptions)
      break
    case ErrorSeverity.MEDIUM:
      toast.warning(error.userMessage, toastOptions)
      break
    case ErrorSeverity.LOW:
      toast.info(error.userMessage, toastOptions)
      break
  }
}

// Retry mechanism with exponential backoff
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        break
      }

      // Don't retry on certain error types
      if (error?.status === 401 || error?.status === 403 || error?.status === 422) {
        break
      }

      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Global error handler for unhandled promises
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const error = createError(
      ErrorType.CLIENT,
      event.reason?.message || "Unhandled promise rejection",
      "Beklenmeyen bir hata oluştu.",
      ErrorSeverity.HIGH,
      { reason: event.reason },
    )

    errorLogger.log(error)
    showErrorToast(error)
    event.preventDefault()
  })
}

// Error boundary hook
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: Record<string, any>) => {
      const appError = handleApiError(error, context)
      showErrorToast(appError)
      return appError
    },

    handleAsyncError: async (asyncFn: () => Promise<any>, context?: Record<string, any>) => {
      try {
        return await asyncFn()
      } catch (error) {
        const appError = handleApiError(error, context)
        showErrorToast(appError)
        throw appError
      }
    },

    retryOperation: retryWithBackoff,
  }
}
