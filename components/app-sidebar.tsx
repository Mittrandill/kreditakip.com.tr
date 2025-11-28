"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  CreditCard,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  UserIcon,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Key,
  Crown,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
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
import { useSubscription } from "@/hooks/use-subscription"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useState, useEffect } from "react"
import { getNotifications } from "@/lib/api/notifications"

interface NavItem {
  href: string
  label: string
  icon: any
  gradient: string
  hoverGradient: string
  badge?: string
}

const navItems: NavItem[] = [
  {
    href: "/uygulama/ana-sayfa",
    label: "Ana Sayfa",
    icon: Home,
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "from-emerald-600 to-teal-700",
  },
  {
    href: "/uygulama/krediler",
    label: "Kredilerim",
    icon: CreditCard,
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "from-emerald-600 to-teal-700",
  },
  {
    href: "/uygulama/odeme-plani",
    label: "Ödeme Planı",
    icon: Calendar,
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "from-emerald-600 to-teal-700",
  },
  {
    href: "/uygulama/raporlar",
    label: "Raporlar",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "from-emerald-600 to-teal-700",
  },
  {
    href: "/uygulama/finansal-saglik",
    label: "AI Finansal Sağlık",
    icon: ShieldCheck,
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "from-emerald-600 to-teal-700",
  },
]

const settingsItems = [
   {
    href: "/uygulama/premium",
    label: "Premium",
    icon: Crown,
    isPremium: true,
  },
  {
    href: "/uygulama/abonelik",
    label: "Abonelik",
    icon: UserIcon,
  },
  {
    href: "/uygulama/bildirimler",
    label: "Bildirimler",
    icon: Bell,
  },
 
  {
    href: "/uygulama/ayarlar",
    label: "Ayarlar",
    icon: Settings
  },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { user, profile, loading } = useAuth()
  const { isPro, isPremium } = useSubscription()
  const { toast } = useToast()
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications to get unread count
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) {
        setUnreadCount(0)
        return
      }

      try {
        const data = await getNotifications(user.id)
        const unread = data?.filter((n) => !n.is_read).length || 0
        setUnreadCount(unread)
      } catch (error) {
        setUnreadCount(0)
      }
    }

    if (user?.id && !loading) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id, loading])

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
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white dark:from-emerald-950/30 dark:to-emerald-950/50 border-r border-gray-200/50 dark:border-white/10">
      {/* Header with Logo */}
      <div className="h-16 bg-gray-50 dark:bg-black/20 border-b border-gray-200/50 dark:border-white/10">
        <div className={`h-full flex items-center justify-center transition-all duration-300 ${isCollapsed ? "px-2" : "px-6"}`}>
          <Link href="/uygulama/ana-sayfa" className="flex items-center gap-3 group">
            {/* Logo Icon */}
            <div className="relative flex-shrink-0">
              <Image
                src="/images/favicon.svg"
                alt="Kredi Takip"
                width={isCollapsed ? 32 : 36}
                height={isCollapsed ? 32 : 36}
                className={`${isCollapsed ? "h-8 w-8" : "h-9 w-9"} group-hover:scale-110 transition-transform duration-300`}
              />
            </div>

            {/* Brand Name */}
            <div className={`transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg tracking-tight text-[#0c241f] dark:text-white" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700 }}>Kredi Takip</span>
                {isPremium && (
                  <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                )}
                {isPro && !isPremium && (
                  <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1.5 ${isCollapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`
                  relative flex items-center rounded-xl transition-all duration-300 group/link
                  ${isCollapsed ? "justify-center h-12 w-12" : "gap-3.5 px-4 h-12"}
                  ${isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split(' ')[1]}/30`
                    : "text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-emerald-900/20"
                  }
                `}
              >
                {/* Icon with gradient background when active */}
                <div className={`relative flex items-center justify-center transition-all duration-300 ${
                  isActive ? "scale-110" : "group-hover/link:scale-105"
                }`}>
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-md"></div>
                  )}
                  <Icon className={`relative h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                    isActive ? "text-white" : "text-gray-600 dark:text-white/40 group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400"
                  }`} />
                </div>

                {/* Label */}
                <span className={`font-medium text-sm transition-all duration-300 ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                } ${isActive ? "text-white" : ""}`}>
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && !isCollapsed && (
                  <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] px-2 py-0.5 border-0">
                    {item.badge}
                  </Badge>
                )}

                {/* Active indicator */}
                {isActive && !isCollapsed && (
                  <ChevronRight className="ml-auto h-4 w-4 text-white/80" />
                )}

                {/* Hover glow effect */}
                {!isActive && (
                  <div className={`absolute inset-0 rounded-xl opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${item.hoverGradient} blur-xl -z-10`}></div>
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
                  <div className="flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <Crown className="h-3 w-3 text-amber-400" />
                    )}
                  </div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Section */}
      <div className={`border-t border-gray-200/50 dark:border-white/10 space-y-1.5 py-3 ${isCollapsed ? "px-2" : "px-3"}`}>
        {/* Settings Items */}
        {settingsItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const isPremiumItem = item.isPremium

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`
                  relative flex items-center rounded-xl transition-all duration-300 group/link
                  ${isCollapsed ? "justify-center h-10 w-10" : "gap-3 px-4 h-10 w-full"}
                  ${isActive
                    ? isPremiumItem
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-emerald-900/20 hover:text-gray-900 dark:hover:text-gray-200"
                  }
                `}
              >
                <div className={`relative flex items-center justify-center transition-all duration-300 ${
                  isActive ? "scale-110" : "group-hover/link:scale-105"
                }`}>
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-md"></div>
                  )}
                  <Icon className={`relative h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                    isActive ? "text-white" : isPremiumItem ? "text-amber-500 dark:text-amber-400" : "text-gray-600 dark:text-white/40 group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400"
                  }`} />
                  {item.label === "Bildirimler" && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center z-10">
                      <span className="text-[10px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
                    </div>
                  )}
                </div>
                <span className={`text-sm font-medium transition-all duration-300 ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                } ${isActive ? "text-white" : ""}`}>
                  {item.label}
                </span>

                {/* Hover glow effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-emerald-600 to-teal-700 blur-xl -z-10"></div>
                )}
              </Link>

              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
                  <div className="flex items-center gap-2">
                    {item.label}
                    {item.label === "Bildirimler" && unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-[20px] justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
                </div>
              )}
            </div>
          )
        })}

        {/* Collapse Button */}
        <div className="relative group">
          <button
            onClick={toggleSidebar}
            className={`
              relative flex items-center rounded-xl transition-all duration-300 group/link
              ${isCollapsed ? "justify-center h-10 w-10" : "gap-3 px-4 h-10 w-full"}
              text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-emerald-900/20 hover:text-gray-900 dark:hover:text-gray-200
            `}
          >
            <div className="relative flex items-center justify-center transition-all duration-300 group-hover/link:scale-105">
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-white/40 group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition-all duration-300" />
              ) : (
                <PanelLeftClose className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-white/40 group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition-all duration-300" />
              )}
            </div>
            {!isCollapsed && (
              <span className="text-sm font-medium transition-all duration-300">
                Menüyü Daralt
              </span>
            )}

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-emerald-600 to-teal-700 blur-xl -z-10"></div>
          </button>

          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
              Menüyü Genişlet
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative group pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`
                  w-full rounded-xl transition-all duration-300 border border-transparent
                  hover:border-emerald-200 dark:hover:border-emerald-800
                  hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50
                  dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30
                  ${isCollapsed ? "px-2 justify-center h-12" : "px-3 justify-start h-16"}
                `}
                disabled={loading}
              >
                <div className={`flex items-center min-w-0 ${isCollapsed ? "" : "gap-3 w-full"}`}>
                  {/* Avatar with gradient ring */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full blur-sm opacity-50"></div>
                    <Avatar className={`relative ${isCollapsed ? "h-8 w-8" : "h-10 w-10"} border-2 border-white dark:border-gray-800`}>
                      <AvatarImage
                        src={profile?.avatar_url || "/placeholder.svg?height=40&width=40&text=User"}
                        alt="User Avatar"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
                        {loading ? "..." : getAvatarFallback()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>

                  {/* User Info */}
                  <div className={`flex flex-col items-start min-w-0 flex-1 transition-all duration-300 ${
                    isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                  }`}>
                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {loading
                        ? "Yükleniyor..."
                        : profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : user?.email || "Kullanıcı"}
                    </span>
                    <span className="truncate text-xs text-gray-500 dark:text-white/60">
                      {isPremium ? "Premium Üye" : isPro ? "Pro Üye" : "Ücretsiz"}
                    </span>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-all duration-300 ${
                    isCollapsed ? "opacity-0 w-0 overflow-hidden absolute" : "opacity-100"
                  }`} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isCollapsed ? "right" : "top"}
              align="start"
              className="w-64 bg-white dark:bg-black/20 dark:backdrop-blur-xl border-gray-200 dark:border-white/10 shadow-xl"
            >
              <DropdownMenuLabel className="text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <span>Hesabım</span>
                  {isPremium && <Crown className="h-4 w-4 text-amber-500" />}
                  {isPro && !isPremium && <Zap className="h-4 w-4 text-blue-500" />}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-emerald-900/20" />
              <DropdownMenuItem
                onClick={() => router.push("/uygulama/ayarlar")}
                className="text-gray-700 dark:text-white/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 cursor-pointer"
              >
                <UserIcon className="mr-3 h-4 w-4" />
                Profil Ayarları
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("https://www.kreditakip.com.tr/sss", "_blank")}
                className="text-gray-700 dark:text-white/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 cursor-pointer"
              >
                <HelpCircle className="mr-3 h-4 w-4" />
                Yardım & Destek
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-emerald-900/20" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 font-medium cursor-pointer"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700">
              <div className="flex flex-col">
                <span className="font-semibold">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : "Hesabım"}
                </span>
                <span className="text-xs text-gray-400">{user?.email}</span>
              </div>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
