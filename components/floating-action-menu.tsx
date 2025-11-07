"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, Scan, CreditCard, KeyRound } from "lucide-react"

const actions = [
  {
    id: 1,
    href: "/uygulama/krediler/pdf-odeme-plani",
    label: "PDF Analizi",
    icon: Scan,
    color: "emerald",
  },
  {
    id: 2,
    href: "/uygulama/krediler/kredi-ekle",
    label: "Kredi Ekle",
    icon: CreditCard,
    color: "blue",
  },
  {
    id: 3,
    href: "/uygulama/sifrelerim/ekle",
    label: "Şifre Ekle",
    icon: KeyRound,
    color: "purple",
  },
]

const getColorClasses = (color: string) => {
  const colors = {
    emerald: {
      bg: "bg-emerald-500 hover:bg-emerald-600",
      ring: "ring-emerald-500/20",
    },
    blue: {
      bg: "bg-blue-500 hover:bg-blue-600",
      ring: "ring-blue-500/20",
    },
    purple: {
      bg: "bg-purple-500 hover:bg-purple-600",
      ring: "ring-purple-500/20",
    },
  }
  return colors[color as keyof typeof colors] || colors.emerald
}

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[2px] z-40 transition-all duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Button - Right Bottom */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Action Items */}
        <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3">
          {actions.map((action, index) => {
            const colorClasses = getColorClasses(action.color)
            const delay = index * 50

            return (
              <Link
                key={action.id}
                href={action.href}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center gap-3 transition-all duration-300 ease-out
                  ${isOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                  }
                `}
                style={{
                  transitionDelay: isOpen ? `${delay}ms` : '0ms',
                }}
              >
                {/* Label */}
                <div className="
                  px-4 py-2.5 rounded-xl
                  bg-white/90 dark:bg-gray-900/90
                  backdrop-blur-xl
                  border border-gray-200/50 dark:border-white/10
                  shadow-lg shadow-black/5
                  opacity-0 group-hover:opacity-100
                  -translate-x-2 group-hover:translate-x-0
                  transition-all duration-200
                  pointer-events-none
                ">
                  <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {action.label}
                  </span>
                </div>

                {/* Icon Button */}
                <button
                  className={`
                    relative
                    w-14 h-14 rounded-2xl
                    ${colorClasses.bg}
                    shadow-lg shadow-black/10
                    flex items-center justify-center
                    text-white
                    transition-all duration-300
                    hover:scale-110 hover:shadow-xl
                    active:scale-95
                    ring-4 ${colorClasses.ring}
                  `}
                >
                  <action.icon className="w-6 h-6" strokeWidth={2} />
                </button>
              </Link>
            )
          })}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative
            w-16 h-16 rounded-2xl
            bg-gradient-to-br from-emerald-500 to-teal-600
            hover:from-emerald-600 hover:to-teal-700
            shadow-xl shadow-emerald-500/25
            hover:shadow-2xl hover:shadow-emerald-500/30
            flex items-center justify-center
            text-white
            transition-all duration-300
            hover:scale-105
            active:scale-95
            ring-4 ring-emerald-500/20
            ${isOpen ? 'rotate-45' : 'rotate-0'}
          `}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>
    </>
  )
}
