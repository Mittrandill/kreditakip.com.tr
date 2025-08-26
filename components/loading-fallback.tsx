"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, RefreshCw, AlertCircle } from "lucide-react"

interface LoadingFallbackProps {
  title?: string
  subtitle?: string
  timeout?: number
  onTimeout?: () => void
  onRetry?: () => void
}

export function LoadingFallback({
  title = "Yükleniyor",
  subtitle,
  timeout = 30000, // 30 seconds
  onTimeout,
  onRetry,
}: LoadingFallbackProps) {
  const [isTimeout, setIsTimeout] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeout / 1000)

  useEffect(() => {
    if (isTimeout) return

    const timer = setTimeout(() => {
      setIsTimeout(true)
      onTimeout?.()
    }, timeout)

    const countdown = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdown)
    }
  }, [timeout, onTimeout, isTimeout])

  if (isTimeout) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Yükleme Zaman Aşımı</h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Veriler beklenenden uzun sürede yükleniyor. İnternet bağlantınızı kontrol edin.
            </p>

            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center gap-8 p-8">
        {/* Premium Logo Animation */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse"></div>

          {/* Rotating ring */}
          <div className="absolute -inset-2 border-2 border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-spin">
            <div className="absolute inset-0.5 bg-white dark:bg-gray-900 rounded-full"></div>
          </div>

          {/* Logo container */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3 max-w-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{subtitle}</p>}

          {timeout > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Zaman aşımı: {Math.ceil(timeLeft)}s</p>
          )}
        </div>

        {/* Minimal progress indicator */}
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}
