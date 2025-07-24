"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Plus, FileText, CreditCard, KeyRound, Scan, X, ArrowRight } from "lucide-react"

const quickActions = [
  {
    href: "/uygulama/krediler/pdf-odeme-plani",
    label: "PDF Kredi Analizi", 
    description: "Döküm analizi",
    icon: Scan,
    color: "emerald",
  },
  {
    href: "/uygulama/krediler/kredi-ekle",
    label: "Manuel Kredi Ekle",
    description: "Kredi bilgisi gir",
    icon: CreditCard,
    color: "blue",
  },
  {
    href: "/uygulama/sifrelerim/ekle",
    label: "Şifre Ekle",
    description: "Güvenli saklama",
    icon: KeyRound,
    color: "purple",
  },
]

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const clearExistingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleContainerMouseEnter = () => {
    clearExistingTimeout()
    setIsOpen(true)
  }

  const handleContainerMouseLeave = () => {
    clearExistingTimeout()
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: {
        bg: "bg-emerald-500",
        text: "text-emerald-600",
        border: "border-emerald-100 dark:border-emerald-800"
      },
      blue: {
        bg: "bg-blue-500", 
        text: "text-blue-600",
        border: "border-blue-100 dark:border-blue-800"
      },
      purple: {
        bg: "bg-purple-500",
        text: "text-purple-600", 
        border: "border-purple-100 dark:border-purple-800"
      }
    }
    return colors[color as keyof typeof colors] || colors.emerald
  }

  return (
    <>
      {/* Mobile - Minimal Design */}
      <div 
        ref={containerRef}
        className="fixed bottom-0 right-0 z-50 md:hidden"
        onMouseEnter={handleContainerMouseEnter}
        onMouseLeave={handleContainerMouseLeave}
      >
        {/* Menu Items */}
        <div
          className={`absolute bottom-16 right-4 transition-all duration-200 ease-out ${
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="space-y-2">
            {quickActions.map((action, index) => {
              const colorClasses = getColorClasses(action.color)
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border ${colorClasses.border} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 group min-w-[200px]`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg ${colorClasses.bg} flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-900 dark:text-white font-medium text-sm block truncate">
                      {action.label}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs block truncate">
                      {action.description}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Main Button - Half Hidden */}
        <div className="relative overflow-hidden h-12 w-12">
          <button
            className={`absolute bottom-0 right-0 w-12 h-12 bg-gray-900 dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center text-white dark:text-gray-900 transition-all duration-300 ${
              isOpen ? "translate-y-0" : "translate-y-6"
            }`}
          >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-45" : "rotate-0"}`} />
          </button>
        </div>
      </div>

      {/* Desktop - Minimal Design */}
      <div 
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 hidden md:block"
        onMouseEnter={handleContainerMouseEnter}
        onMouseLeave={handleContainerMouseLeave}
      >
        {/* Menu Card */}
        <div
          className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-out ${
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
              : "opacity-0 translate-y-2 pointer-events-none scale-95"
          }`}
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 min-w-[280px]">
            {/* Menu Items */}
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const colorClasses = getColorClasses(action.color)
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border ${colorClasses.border} hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] group`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className={`w-9 h-9 rounded-lg ${colorClasses.bg} flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-900 dark:text-white font-medium text-sm block">
                        {action.label}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs block">
                        {action.description}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Button - Half Hidden */}
        <div className="relative overflow-hidden h-8 w-16">
          <button
            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gray-900 dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center text-white dark:text-gray-900 transition-all duration-300 ${
              isOpen ? "translate-y-0" : "translate-y-8"
            }`}
          >
            <Plus className={`w-6 h-6 transition-transform duration-200 ${isOpen ? "rotate-45" : "rotate-0"}`} />
          </button>
        </div>
      </div>
    </>
  )
}
