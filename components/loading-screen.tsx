"use client"

import { CreditCard } from "lucide-react"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingScreen({ title = "Yükleniyor", subtitle, size = "md" }: LoadingScreenProps) {
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
