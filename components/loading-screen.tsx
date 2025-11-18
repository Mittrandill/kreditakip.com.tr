"use client"

import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingScreen({ size = "lg", className }: LoadingScreenProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[60vh] w-full", className)}>
      <div className="relative">
        {/* Outer spinning gradient ring */}
        <svg className={cn("animate-spin", sizeClasses[size])} viewBox="0 0 50 50">
          {/* Background circle */}
          <circle
            className="opacity-20"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            style={{ color: 'rgb(16 185 129)' }}
          />
          {/* Animated gradient circle */}
          <circle
            className="opacity-100"
            cx="25"
            cy="25"
            r="20"
            stroke="url(#loading-gradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset="30"
          />
          <defs>
            <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(16 185 129)" />
              <stop offset="50%" stopColor="rgb(20 184 166)" />
              <stop offset="100%" stopColor="rgb(16 185 129)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

// Inline variant for use within components
export function LoadingSpinner({
  size = "md",
  className
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  }

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      <svg className="animate-spin absolute inset-0" viewBox="0 0 50 50">
        <circle
          className="opacity-20"
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          style={{ color: 'rgb(16 185 129)' }}
        />
        <circle
          className="opacity-100"
          cx="25"
          cy="25"
          r="20"
          stroke="url(#spinner-gradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset="30"
        />
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(16 185 129)" />
            <stop offset="50%" stopColor="rgb(20 184 166)" />
            <stop offset="100%" stopColor="rgb(16 185 129)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
