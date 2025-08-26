"use client"

import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { createError, ErrorType, ErrorSeverity, errorLogger } from "@/lib/utils/error-handling"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our error handling system
    const appError = createError(
      ErrorType.CLIENT,
      error.message,
      "Uygulama beklenmedik bir hatayla karşılaştı.",
      ErrorSeverity.CRITICAL,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        stack: error.stack,
      },
    )

    errorLogger.log(appError)

    this.setState({ errorId: appError.id })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  handleReportBug = () => {
    const subject = encodeURIComponent("Uygulama Hatası Raporu")
    const body = encodeURIComponent(`
Hata ID: ${this.state.errorId}
Hata Mesajı: ${this.state.error?.message}
Zaman: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Lütfen hatanın nasıl oluştuğunu açıklayın:
    `)

    window.open(`mailto:destek@kreditakip.com.tr?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Beklenmeyen Hata</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Uygulama beklenmedik bir hatayla karşılaştı. Bu durumu düzeltmek için çalışıyoruz.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Geliştirici Bilgisi:</p>
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full" variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tekrar Dene
                </Button>

                <Button onClick={this.handleGoHome} className="w-full bg-transparent" variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>

                <Button onClick={this.handleReportBug} className="w-full" variant="ghost" size="sm">
                  <Bug className="w-4 h-4 mr-2" />
                  Hata Bildir
                </Button>
              </div>

              {this.state.errorId && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hata ID: {this.state.errorId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
