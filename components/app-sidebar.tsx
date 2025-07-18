"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Home,
  CreditCard,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronUp,
  UserIcon,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Menu,
  RefreshCw,
  Wallet,
  Key,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const navItems = [
  { href: "/uygulama/ana-sayfa", label: "Ana Sayfa", icon: Home },
  { href: "/uygulama/krediler", label: "Kredilerim", icon: CreditCard },
  { href: "/uygulama/hesaplar", label: "Hesaplarım", icon: Wallet },
  { href: "/uygulama/kredi-kartlari", label: "Kredi Kartlarım", icon: CreditCard },
  { href: "/uygulama/sifrelerim", label: "Şifrelerim", icon: Key },
  { href: "/uygulama/odeme-plani", label: "Ödeme Planı", icon: Calendar },
  { href: "/uygulama/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/uygulama/risk-analizi", label: "Risk Analizi", icon: ShieldCheck },
  { href: "/uygulama/refinansman", label: "Refinansman", icon: RefreshCw },
]

const settingsItems = [
  { href: "/uygulama/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/uygulama/ayarlar", label: "Ayarlar", icon: Settings },
  { href: "#", label: "Menüyü Daralt", icon: Menu, action: "toggle" },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { user, profile, loading } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Çıkış Başarılı",
        description: "Giriş sayfasına yönlendiriliyorsunuz.",
      })
      router.push("/giris")
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir sorun oluştu.",
        variant: "destructive",
      })
      console.error("Sign out error:", error)
    }
  }

  const getAvatarFallback = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return "KT"
  }

  return (
    <>
      {/* Header */}
      <div
        className={`border-b border-gray-200 dark:border-gray-800 transition-all duration-200 h-16 flex items-center ${isCollapsed ? "px-3" : "px-4"}`}
      >
        <Link href="/uygulama/ana-sayfa" className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
            <Image src="/images/favicon.svg" alt="KrediTakip Logo" width={32} height={32} className="h-8 w-8" />
          </div>
          <span
            className={`text-xl font-semibold text-gray-900 dark:text-white transition-all duration-200 ${
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            Kredi Takip
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className={`flex-1 space-y-1 transition-all duration-200 ${isCollapsed ? "px-2 py-2" : "p-2"}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 h-10 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                    : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400"
                } ${isCollapsed ? "justify-center px-2 w-10" : "justify-start gap-3 px-3"}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`transition-all duration-200 ${
                    isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        className={`border-t border-gray-200 dark:border-gray-800 space-y-1 transition-all duration-200 ${isCollapsed ? "px-2 py-2" : "p-2"}`}
      >
        {/* Settings Items */}
        {settingsItems.map((item) => {
          const isActive = pathname === item.href

          if (item.action === "toggle") {
            return (
              <div key="toggle-sidebar" className="relative group">
                <button
                  onClick={toggleSidebar}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 h-10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 ${
                    isCollapsed ? "justify-center px-2 w-10" : "justify-start gap-3 px-3 w-full"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={`transition-all duration-200 ${
                      isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 h-10 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                    : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400"
                } ${isCollapsed ? "justify-center px-2 w-10" : "justify-start gap-3 px-3"}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`transition-all duration-200 ${
                    isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}

        <Separator
          className={`bg-gray-200 dark:bg-gray-800 transition-all duration-200 ${isCollapsed ? "my-1" : "my-2"}`}
        />

        {/* User Menu */}
        <div className="relative group">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full rounded-lg text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 h-12 ${
                  isCollapsed ? "px-2 justify-center" : "px-3 justify-start"
                }`}
                disabled={loading}
              >
                <div className={`flex items-center min-w-0 ${isCollapsed ? "" : "gap-3"}`}>
                  <Avatar className={`flex-shrink-0 ${isCollapsed ? "h-6 w-6" : "h-8 w-8"}`}>
                    <AvatarImage
                      src={profile?.avatar_url || "/placeholder.svg?height=32&width=32&text=User"}
                      alt="User Avatar"
                    />
                    <AvatarFallback className="text-xs">{loading ? "..." : getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col items-start min-w-0 transition-all duration-200 ${
                      isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                    }`}
                  >
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {loading
                        ? "Yükleniyor..."
                        : profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : user?.email || "Kullanıcı"}
                    </span>
                    <span className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</span>
                  </div>
                  <ChevronUp
                    className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-all duration-200 ${
                      isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100 ml-auto"
                    }`}
                  />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56 mb-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            >
              <DropdownMenuLabel className="text-gray-900 dark:text-white">Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
              <DropdownMenuItem
                onClick={() => router.push("/uygulama/ayarlar")}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Briefcase className="mr-2 h-4 w-4" />
                Faturalama
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <HelpCircle className="mr-2 h-4 w-4" />
                Destek
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tooltip for collapsed user menu */}
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Hesap Menüsü
            </div>
          )}
        </div>
      </div>
    </>
  )
}
