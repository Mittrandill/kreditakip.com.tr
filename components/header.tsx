"use client"

import type React from "react"
import type { Credit } from "@/lib/types"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Bell,
  Search,
  Menu,
  Settings,
  LogOut,
  UserIcon,
  Briefcase,
  HelpCircle,
  Home,
  CreditCard,
  Calendar,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  ArrowRight,
  X,
  Moon,
  Sun,
  KeyRound,
  Crown,
  Receipt,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useState, useEffect, useRef, useMemo } from "react"
import { useUserTheme } from "@/components/user-theme-provider"
import { getNotifications, markNotificationAsRead } from "@/lib/api/notifications"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { getCredits } from "@/lib/api/credits"
import BankLogo from "@/components/bank-logo"
import { Badge } from "@/components/ui/badge"
import { NotificationSheet } from "@/components/notification-sheet"

interface HeaderProps {
  pageTitle?: string
}

const navItems = [
  { href: "/uygulama/ana-sayfa", label: "Ana Sayfa", icon: Home },
  { href: "/uygulama/krediler", label: "Kredilerim", icon: CreditCard },
  { href: "/uygulama/odeme-plani", label: "Ödeme Planı", icon: Calendar },
  { href: "/uygulama/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/uygulama/finansal-saglik", label: "AI Finansal Sağlık Özeti", icon: ShieldCheck },
  { href: "/uygulama/premium", label: "Premium", icon: Crown },
  { href: "/uygulama/abonelik", label: "Abonelik", icon: UserIcon },
]

const settingsItems = [
  { href: "/uygulama/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/uygulama/ayarlar", label: "Ayarlar", icon: Settings },
]

// Dinamik sayfa başlıkları ve açıklamaları mapping'i
const PAGE_INFO: Record<string, { title: string; description: string; parent?: string }> = {
  "/uygulama/ana-sayfa": {
    title: "Ana Sayfa",
    description: "Kredi portföyünüzün genel görünümü ve önemli bilgiler",
  },
  "/uygulama/krediler": {
    title: "Kredilerim",
    description: "Tüm aktif kredilerinizi görüntüleyin ve yönetin",
  },
  "/uygulama/krediler/kredi-ekle": {
    title: "Kredi Ekle",
    description: "Yeni kredi bilgilerinizi sisteme ekleyin",
    parent: "Kredilerim",
  },
  "/uygulama/krediler/pdf-odeme-plani": {
    title: "PDF Ödeme Planı",
    description: "PDF dosyasından ödeme planı bilgilerini çıkarın",
    parent: "Kredilerim",
  },
  "/uygulama/krediler/pdf-odeme-plani/analiz": {
    title: "PDF Analizi",
    description: "Yüklenen PDF dosyasının analiz sonuçları",
    parent: "PDF Ödeme Planı",
  },
  "/uygulama/kredi-detay": {
    title: "Kredi Detayı",
    description: "Seçilen kredinin detaylı bilgileri ve ödeme planı",
    parent: "Kredilerim",
  },
  "/uygulama/kredi-duzenle": {
    title: "Kredi Düzenle",
    description: "Kredi bilgilerinizi güncelleyin",
    parent: "Kredilerim",
  },
  "/uygulama/odeme-plani": {
    title: "Ödeme Planı",
    description: "Tüm kredilerinizin ödeme takvimi ve yaklaşan ödemeler",
  },
  "/uygulama/raporlar": {
    title: "Raporlar",
    description: "Finansal durumunuzun detaylı analizi ve raporları",
  },
  "/uygulama/finansal-saglik": {
    title: "AI Finansal Sağlık Özeti",
    description: "Finansal sağlık değerlendirmeniz ve öneriler",
  },
  "/uygulama/bildirimler": {
    title: "Bildirimler",
    description: "Sistem bildirimleri ve önemli hatırlatmalar",
  },
  "/uygulama/ayarlar": {
    title: "Ayarlar",
    description: "Hesap ayarları ve uygulama tercihleri",
  },
  "/uygulama/profil": {
    title: "Profil",
    description: "Kişisel bilgilerinizi görüntüleyin ve düzenleyin",
  },
  "/uygulama/hesaplar": {
    title: "Hesaplarım",
    description: "Banka hesaplarınızı görüntüleyin, yönetin ve takip edin",
  },
  "/uygulama/hesaplar/ekle": {
    title: "Hesap Ekle",
    description: "Yeni banka hesabı bilgilerinizi sisteme ekleyin",
    parent: "Hesaplarım",
  },
  "/uygulama/premium": {
    title: "Premium Üyelik",
    description: "Premium özelliklere erişin ve reklamsız deneyimin keyfini çıkarın",
  },
  "/uygulama/abonelik": {
    title: "Abonelik Yönetimi",
    description: "Abonelik bilgilerinizi, kayıtlı kartlarınızı, faturalarınızı ve ödeme geçmişinizi yönetin",
  },
  "/uygulama/odeme": {
    title: "Ödeme",
    description: "Güvenli ödeme ile premium üyeliğe geçin",
    parent: "Premium Üyelik",
  },
}

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    borderColor: "border-l-blue-400 dark:border-l-blue-500",
    dotColor: "bg-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
    borderColor: "border-l-orange-400 dark:border-l-orange-500",
    dotColor: "bg-orange-500",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
    borderColor: "border-l-red-400 dark:border-l-red-500",
    dotColor: "bg-red-500",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
    borderColor: "border-l-green-400 dark:border-l-green-500",
    dotColor: "bg-green-500",
  },
}

export default function Header({ pageTitle }: HeaderProps) {
  const isMobile = useIsMobile()
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const pathname = usePathname()
  const { theme, setTheme } = useUserTheme()
  const isDarkMode = theme === "dark"

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [allCredits, setAllCredits] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Dinamik sayfa başlığı ve açıklama belirleme
  const pageInfo = useMemo(() => {
    if (pageTitle) return { title: pageTitle, description: "", parent: null }

    if (pathname.includes("/kredi-detay/"))
      return {
        title: "Kredi Detayı",
        description: "Seçilen kredinin detaylı bilgileri ve ödeme planı",
        parent: "Kredilerim",
      }
    if (pathname.includes("/odeme-detay/"))
      return {
        title: "Ödeme Makbuzu",
        description: "Seçilen ödemenin detaylı bilgilerini görebilir ve yazdırabilirsiniz.",
        parent: "Kredilerim > Kredi Detayı",
      }
    if (pathname.includes("/kredi-duzenle/"))
      return {
        title: "Kredi Düzenle",
        description: "Kredi bilgilerinizi güncelleyin",
        parent: "Kredilerim",
      }
    if (pathname.includes("/kredi-kartlari/ekle"))
      return {
        title: "Kredi Kartı Ekle",
        description: "Yeni kredi kartı bilgilerinizi sisteme ekleyin",
        parent: "Kredi Kartlarım",
      }
    if (pathname.includes("/kredi-kartlari/") && pathname.includes("/duzenle"))
      return {
        title: "Kredi Kartı Düzenle",
        description: "Kredi kartı bilgilerinizi güncelleyin",
        parent: "Kredi Kartlarım",
      }
    if (
      pathname.includes("/kredi-kartlari/") &&
      !pathname.includes("/duzenle") &&
      !pathname.includes("/ekle") &&
      pathname !== "/uygulama/kredi-kartlari"
    )
      return {
        title: "Kredi Kartı Detayı",
        description: "Seçilen kredi kartının detaylı bilgileri",
        parent: "Kredi Kartlarım",
      }

    if (pathname.includes("/hesaplar/ekle"))
      return {
        title: "Hesap Ekle",
        description: "Yeni banka hesabı bilgilerinizi sisteme ekleyin",
        parent: "Hesaplarım",
      }
    if (pathname.includes("/hesaplar/") && pathname.includes("/duzenle"))
      return {
        title: "Hesap Düzenle",
        description: "Banka hesabı bilgilerinizi güncelleyin",
        parent: "Hesaplarım",
      }
    if (
      pathname.includes("/hesaplar/") &&
      !pathname.includes("/duzenle") &&
      !pathname.includes("/ekle") &&
      pathname !== "/uygulama/hesaplar"
    )
      return {
        title: "Hesap Detayı",
        description: "Seçilen hesabın detaylı bilgileri ve işlem geçmişi",
        parent: "Hesaplarım",
      }

    if (pathname.includes("/finansal-saglik/") && pathname !== "/uygulama/finansal-saglik")
      return {
        title: "AI Finansal Sağlık Özeti Detayı",
        description: "Detaylı finansal sağlık analizi sonuçları ve öneriler",
        parent: "AI Finansal Sağlık Özeti",
      }
    if (pathname.includes("/pdf-odeme-plani/analiz/"))
      return {
        title: "PDF Analiz Detayı",
        description: "PDF analiz sonuçlarının detaylı görünümü",
        parent: "PDF Ödeme Planı",
      }


    const info = PAGE_INFO[pathname]
    if (info) return info

    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]

    if (lastSegment) {
      const title = lastSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      return { title, description: "", parent: null }
    }

    return { title: "Dashboard", description: "", parent: null }
  }, [pathname, pageTitle])

  const loadHeaderNotifications = async () => {
    if (!user?.id) {
      return
    }

    try {
      const data = await getNotifications(user.id)
      const recent = data?.slice(0, 5) || []
      const unread = data?.filter((n) => !n.is_read).length || 0
      setNotifications(recent)
      setUnreadCount(unread)
    } catch (error) {
      console.error("Error loading header notifications:", error)
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const handleHeaderNotificationClick = async (notification: any) => {
    setSelectedNotification(notification)
    setNotificationSheetOpen(true)
    setNotificationOpen(false)

    // Okunmamışsa okundu olarak işaretle
    if (!notification.is_read && user?.id) {
      try {
        await markNotificationAsRead(user.id, notification.id)
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }
  }

  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
    }

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [notificationOpen])

  useEffect(() => {
    if (user?.id && !loading) {
      loadHeaderNotifications()
      const interval = setInterval(loadHeaderNotifications, 30000)
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

  const performSearch = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results: any[] = []

    // Search through credits
    allCredits.forEach((credit) => {
      const bankName = credit.banks?.name?.toLowerCase() || ""
      const creditType = credit.credit_types?.name?.toLowerCase() || ""
      const creditCode = credit.credit_code?.toLowerCase() || ""

      if (bankName.includes(query) || creditType.includes(query) || creditCode.includes(query)) {
        results.push({
          type: "credit",
          id: credit.id,
          title: credit.banks?.name || "Bilinmeyen Banka",
          subtitle: `${credit.credit_types?.name || "Kredi"} - ${credit.credit_code || ""}`,
          description: `Kalan Borç: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(credit.remaining_debt)}`,
          href: `/uygulama/kredi-detay/${credit.id}`,
          icon: credit.banks?.logo_url,
          status: credit.status,
        })
      }
    })

    // Search through navigation items
    navItems.forEach((item) => {
      if (item.label.toLowerCase().includes(query)) {
        results.push({
          type: "page",
          id: item.href,
          title: item.label,
          subtitle: "Sayfa",
          description: "Uygulama sayfası",
          href: item.href,
          icon: item.icon,
        })
      }
    })

    // Search through settings items
    settingsItems.forEach((item) => {
      if (item.label.toLowerCase().includes(query)) {
        results.push({
          type: "page",
          id: item.href,
          title: item.label,
          subtitle: "Ayarlar",
          description: "Ayarlar sayfası",
          href: item.href,
          icon: item.icon,
        })
      }
    })

    setSearchResults(results.slice(0, 8)) // Limit to 8 results
  }, [searchQuery, allCredits])

  useEffect(() => {
    performSearch
  }, [performSearch])

  useEffect(() => {
    const loadCreditsForSearch = async () => {
      if (!user?.id) return

      try {
        const creditsData = await getCredits(user.id)
        setAllCredits(creditsData || [])
      } catch (error) {
        console.error("Error loading credits for search:", error)
      }
    }

    loadCreditsForSearch()
  }, [user?.id])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setSearchOpen(value.length >= 2)
  }

  const handleSearchResultClick = (result: any) => {
    setSearchQuery("")
    setSearchOpen(false)
    router.push(result.href)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchQuery("")
      setSearchOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchOpen])

  // Toggle theme handler - syncs with Supabase via useThemeSync hook
  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setTheme(newTheme)
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white/80 dark:bg-black/20 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/20 px-4 sm:px-6 md:px-8 shadow-sm border-emerald-100 dark:border-white/10">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden bg-transparent border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-emerald-900/20"
            >
              <Menu className="h-5 w-5 text-gray-700 dark:text-white/70" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex flex-col p-0 w-80 bg-white dark:bg-black/20 border-gray-200 dark:border-white/10"
          >
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/20">
              <Link
                href="/uygulama/ana-sayfa"
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
              >
                <Image src="/images/favicon.svg" alt="Kredi Takip Logo" width={32} height={32} className="h-8 w-8" />
                <span>Kredi Takip</span>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 p-2 space-y-1 bg-white dark:bg-black/20">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 text-white shadow-sm"
                        : "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-white/70 hover:text-emerald-700 dark:hover:text-emerald-400"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-white/10 space-y-1 bg-white dark:bg-black/20">
              {settingsItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 text-white shadow-sm"
                        : "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-white/70 hover:text-emerald-700 dark:hover:text-emerald-400"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Yardım & Destek Link */}
              <button
                onClick={() => window.open("https://www.kreditakip.com.tr/sss", "_blank")}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-white/70 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                <HelpCircle className="h-5 w-5 flex-shrink-0" />
                <span>Yardım & Destek</span>
              </button>

              {/* Mobile User Section */}
              <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || "/placeholder.svg?height=32&width=32&text=User"}
                      alt="User Avatar"
                    />
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      {loading ? "..." : getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate text-gray-900 dark:text-white">
                    {loading
                      ? "Yükleniyor..."
                      : profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : user?.email || "Kullanıcı"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Çıkış Yap</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        ""
      )}

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {/* Dinamik Sayfa Başlığı ve Breadcrumb */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Breadcrumb */}
          {pageInfo.parent && (
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
              <span className="font-medium">{pageInfo.parent}</span>
              <svg
                className="w-3 h-3 text-gray-400 dark:text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-white/70">{pageInfo.title}</span>
            </div>
          )}

          {/* Sayfa Başlığı ve Açıklama */}
          <div className="min-w-0">
            {!pageInfo.parent && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate transition-all duration-300">
                {pageInfo.title}
              </h1>
            )}
            {pageInfo.description && (
              <p className="text-sm text-gray-500 dark:text-white/60 truncate max-w-[400px] hidden md:block leading-tight">
                {pageInfo.description}
              </p>
            )}
          </div>
        </div>

        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-white/60 pointer-events-none" />
            <Input
              type="search"
              placeholder="Ara..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] rounded-lg bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 focus-visible:shadow-[0_0_0_0.5px_rgb(16,185,129)] dark:focus-visible:shadow-[0_0_0_0.5px_rgb(52,211,153)] transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
              aria-label="Search"
              autoComplete="off"
              spellCheck="false"
            />

            {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black/20 dark:backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200 dark:border-white/10 z-50 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-white/60 mt-2">Aranıyor...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors duration-150 flex items-center gap-3"
                      >
                        <div className="flex-shrink-0">
                          {result.type === "credit" && result.icon ? (
                            <BankLogo
                              bankName={result.title}
                              logoUrl={result.icon}
                              size="sm"
                              className="ring-1 ring-gray-200 dark:ring-emerald-900/30"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                              {result.icon ? (
                                <result.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{result.title}</p>
                            {result.status && (
                              <Badge
                                variant={
                                  result.status === "active"
                                    ? "default"
                                    : result.status === "overdue"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {result.status === "active"
                                  ? "Aktif"
                                  : result.status === "overdue"
                                    ? "Gecikmiş"
                                    : result.status === "closed"
                                      ? "Kapalı"
                                      : result.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-white/60 truncate">{result.subtitle}</p>
                          {result.description && (
                            <p className="text-xs text-gray-400 dark:text-white/60 truncate">{result.description}</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 dark:text-white/60 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <Search className="h-8 w-8 text-gray-400 dark:text-white/60 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-white/60">"{searchQuery}" için sonuç bulunamadı</p>
                    <p className="text-xs text-gray-400 dark:text-white/60 mt-1">
                      Kredi, banka adı veya sayfa adı arayın
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-emerald-900/20 transition-colors"
          onClick={toggleTheme}
          aria-label="Tema değiştir"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-gray-600 dark:text-white/60" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 dark:text-white/60" />
          )}
        </Button>

        {/* Notification Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 dark:hover:from-emerald-900/20 dark:hover:to-blue-900/20 relative transition-all duration-300 hover:shadow-md"
            aria-label="Notifications"
            onClick={toggleNotifications}
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-white/60" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs flex items-center justify-center font-bold shadow-lg animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {notificationOpen && (
            <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-black/20 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden backdrop-blur-sm">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-lg">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Bildirimler</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Hepsi okundu"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={toggleNotifications}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto bg-white dark:bg-black/20">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Henüz bildirim yok</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Yeni bildirimler burada görünecek</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.map((notification) => {
                      const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.info
                      const Icon = config.icon

                      return (
                        <div
                          key={notification.id}
                          className={`
                            p-4 cursor-pointer transition-all duration-200
                            ${
                              notification.is_read
                                ? "bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/30"
                                : "bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                            }
                          `}
                          onClick={() => handleHeaderNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${config.color} flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4
                                  className={`font-semibold text-sm ${
                                    notification.is_read
                                      ? "text-gray-700 dark:text-gray-300"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                                )}
                              </div>

                              <p
                                className={`text-sm mb-2 line-clamp-2 ${
                                  notification.is_read
                                    ? "text-gray-600 dark:text-gray-400"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {notification.message}
                              </p>

                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: tr,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <Link href="/uygulama/bildirimler" onClick={() => setNotificationOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 text-white text-sm">
                      Tüm Bildirimleri Görüntüle
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 hover:bg-gray-100 dark:hover:bg-emerald-900/20"
              disabled={loading}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={profile?.avatar_url || "/placeholder.svg?height=32&width=32&text=User"}
                  alt="User Avatar"
                />
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {loading ? "..." : getAvatarFallback()}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white dark:bg-black/20 dark:backdrop-blur-xl border-gray-200 dark:border-white/10 shadow-lg"
          >
            <DropdownMenuLabel className="text-gray-900 dark:text-white">
              {loading
                ? "Yükleniyor..."
                : profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : user?.email || "Hesabım"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-emerald-900/20" />
            <DropdownMenuItem
              onClick={() => router.push("/uygulama/ayarlar")}
              className="text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-emerald-900/20 focus:bg-gray-100 dark:focus:bg-emerald-900/20"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/uygulama/ayarlar")}
              className="text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-emerald-900/20 focus:bg-gray-100 dark:focus:bg-emerald-900/20"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Ayarlar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/uygulama/abonelik")}
              className="text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-emerald-900/20 focus:bg-gray-100 dark:focus:bg-emerald-900/20 cursor-pointer"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Abonelik</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open("https://www.kreditakip.com.tr/sss", "_blank")}
              className="text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-emerald-900/20 focus:bg-gray-100 dark:focus:bg-emerald-900/20 cursor-pointer"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Destek</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-emerald-900/20" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-emerald-900/20 focus:bg-gray-100 dark:focus:bg-emerald-900/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bildirim Detay Sheet */}
      <NotificationSheet
        notification={selectedNotification}
        open={notificationSheetOpen}
        onOpenChange={setNotificationSheetOpen}
      />
    </header>
  )
}
