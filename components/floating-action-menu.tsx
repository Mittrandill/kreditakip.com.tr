"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronUp, Scan, CreditCard, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

const quickActions = [
  {
    id: 1,
    label: "PDF Analizi",
    route: "/uygulama/krediler/pdf-odeme-plani",
    icon: Scan
  },
  {
    id: 2,
    label: "Manuel Kredi Ekle",
    route: "/uygulama/krediler/kredi-ekle",
    icon: CreditCard
  },
  {
    id: 3,
    label: "Abonelik",
    route: "/uygulama/abonelik",
    icon: Receipt
  },
]

export default function FloatingActionMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleNavigate = (route: string) => {
    setIsOpen(false)
    router.push(route)
  }

  const toggleMenu = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50">
      <div className="relative" onMouseEnter={() => !isOpen && setIsOpen(true)}>
        {/* Quick Actions Menu */}
        <div
          ref={menuRef}
          className={cn(
            "absolute bottom-16 -left-28 bg-gradient-to-b from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black rounded-xl shadow-2xl overflow-hidden w-64 transition-all duration-300 ease-in-out",
            "border border-gray-700/50 dark:border-white/10 backdrop-blur-sm",
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          )}
          style={{
            boxShadow: isOpen ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)" : "none",
            transform: isOpen ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <div className="py-1">
            <h3 className="px-4 py-3 text-sm font-medium text-gray-100 dark:text-white border-b border-gray-700/50 dark:border-white/10 flex items-center">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent font-bold">
                HIZLI İŞLEMLER
              </span>
            </h3>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {quickActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => handleNavigate(action.route)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-[13px] text-gray-200 dark:text-white/80 hover:bg-gray-700/50 dark:hover:bg-white/10 flex items-center gap-3 transition-all duration-200",
                    "hover:pl-6 hover:text-white group",
                    index !== quickActions.length - 1 && "border-b border-gray-700/30 dark:border-white/5",
                  )}
                >
                  <div className="w-6 h-6 flex items-center justify-center bg-gray-700 dark:bg-white/10 rounded-full group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-600 transition-colors duration-200">
                    <action.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium tracking-wide">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Connector between menu and button */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 dark:bg-black rotate-45 border-r border-b border-gray-700/50 dark:border-white/10" />
        </div>

        {/* Floating Action Button */}
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          aria-label={isOpen ? "Kapat" : "Hızlı İşlemler"}
          aria-expanded={isOpen}
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300",
            "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400",
            "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-900 dark:focus:ring-offset-[#151515]",
            isOpen ? "translate-y-0" : "translate-y-[28px] hover:translate-y-[20px]",
          )}
          style={{
            boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -4px rgba(20, 184, 166, 0.2)",
          }}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-emerald-400/20 animate-ping",
              isOpen ? "opacity-0" : "opacity-100",
            )}
          />
          {isOpen ? (
            <ChevronUp className="w-6 h-6 text-white" />
          ) : (
            <Plus className={cn("w-7 h-7 text-white transition-transform duration-300")} />
          )}
        </button>
      </div>
    </div>
  )
}
