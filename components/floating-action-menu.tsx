"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, FileText, ShieldCheck, BarChart3, X } from "lucide-react"

const quickActions = [
  {
    href: "/uygulama/krediler/kredi-ekle",
    label: "Kredi Ekle",
    icon: Plus,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    href: "/uygulama/krediler/pdf-odeme-plani",
    label: "PDF Ödeme Planı",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    href: "/uygulama/risk-analizi",
    label: "Risk Analizi",
    icon: ShieldCheck,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    href: "/uygulama/raporlar",
    label: "Raporlar",
    icon: BarChart3,
    gradient: "from-orange-500 to-red-600",
  },
]

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />}

      {/* Menu Card */}
      <div
        className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
            : "opacity-0 translate-y-4 pointer-events-none scale-95"
        }`}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 min-w-[320px] relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">Hızlı İşlemler</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sık kullanılan işlemler</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="relative space-y-3">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={handleClose}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/30 dark:border-gray-700/30 hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group backdrop-blur-sm"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-110`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-900 dark:text-white font-semibold text-sm block">{action.label}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">Hızlı erişim</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Plus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main FAB Button - Half circle hidden by default */}
      <div className="relative overflow-hidden">
        <button
          className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-2xl flex items-center justify-center text-white transition-all duration-500 group relative ${
            isOpen ? "ring-4 ring-blue-200 dark:ring-blue-800 translate-y-0" : "translate-y-8"
          } hover:translate-y-0`}
          onClick={handleToggle}
          onMouseEnter={() => setIsOpen(true)}
        >
          {/* Plus Icon - Hidden by default, visible on hover */}
          <Plus
            className={`w-6 h-6 transition-all duration-300 ${
              isOpen ? "rotate-45 opacity-100 scale-100" : "rotate-0 opacity-0 scale-75"
            } group-hover:opacity-100 group-hover:scale-100`}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  )
}
