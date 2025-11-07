"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/metric-card"
import { PaginationModern } from "@/components/ui/pagination-modern"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationSheet } from "@/components/notification-sheet"
import { useAuth } from "@/hooks/use-auth"
import {
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/api/notifications"
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  Filter,
  Sparkles,
  MoreHorizontal,
  Check,
  Trash2,
  Info,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { tr } from "date-fns/locale"

const ITEMS_PER_PAGE = 10

interface NotificationStats {
  total: number
  unread: number
  read: number
  warnings: number
  success: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    badgeClass:
      "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800",
    label: "Bilgi",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/30",
    badgeClass:
      "bg-gradient-to-r from-orange-600 to-red-700 text-white border-transparent hover:from-orange-700 hover:to-red-800",
    label: "Uyarı",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/30",
    badgeClass:
      "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800",
    label: "Hata",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/30",
    badgeClass:
      "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800",
    label: "Başarılı",
  },
}

export default function BildirimlerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    warnings: 0,
    success: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const loadNotifications = async (includeAutoCreate = false) => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Eğer talep edilirse önce otomatik bildirim oluştur
      if (includeAutoCreate) {
        await autoCreateNotifications()
      }

      const [notificationsData, statsData] = await Promise.all([
        getNotifications(user.id),
        getNotificationStats(user.id),
      ])

      setNotifications(notificationsData || [])
      const defaultStats: NotificationStats = {
        total: 0,
        unread: 0,
        read: 0,
        warnings: 0,
        success: 0,
      }
      setStats({ ...defaultStats, ...statsData } as NotificationStats)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error("Bildirimler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  // Otomatik bildirim oluşturma - sadece yenile butonuna basıldığında çalışır
  const autoCreateNotifications = async () => {
    if (!user?.id) return

    try {
      // API endpoint'ini çağır
      const response = await fetch("/api/notifications/auto-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        const result = await response.json()
        // Yeni bildirimler oluşturulduysa toast göster
        if (result.notifications && result.notifications.length > 0) {
          toast.success(`${result.notifications.length} yeni bildirim oluşturuldu`)
        }
      }
    } catch (error) {
      console.error("Error auto-creating notifications:", error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return

    try {
      await markNotificationAsRead(user.id, notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      }))
      toast.success("Bildirim okundu olarak işaretlendi")
    } catch (error) {
      toast.error("Bildirim güncellenirken hata oluştu")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return

    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setStats((prev) => ({
        ...prev,
        unread: 0,
        read: prev.total,
      }))
      toast.success("Tüm bildirimler okundu olarak işaretlendi")
    } catch (error) {
      toast.error("Bildirimler güncellenirken hata oluştu")
    }
  }

  const handleViewNotification = async (notification: Notification) => {
    setSelectedNotification(notification)
    setSheetOpen(true)

    // Okunmamışsa okundu olarak işaretle
    if (!notification.is_read && user?.id) {
      try {
        await markNotificationAsRead(user.id, notification.id)
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1,
        }))
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!user?.id) return

    try {
      await deleteNotification(user.id, notificationId)
      const deletedNotification = notifications.find((n) => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        unread: deletedNotification?.is_read ? prev.unread : prev.unread - 1,
        read: deletedNotification?.is_read ? prev.read - 1 : prev.read,
      }))
      toast.success("Bildirim silindi")
      setSheetOpen(false)
    } catch (error) {
      toast.error("Bildirim silinirken hata oluştu")
    }
  }

  // Filtrelenmiş bildirimler
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesReadStatus = !showUnreadOnly || !notification.is_read

    return matchesSearch && matchesReadStatus
  })

  // Sayfalandırma
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    loadNotifications()
    // Otomatik bildirim oluşturmayı kaldırdık - bu her reload'da yeni bildirim oluşturuyordu
    // Bunun yerine sadece cron job veya kullanıcı manual olarak yenilediğinde çalışsın
  }, [user?.id])

  // Sayfa değiştiğinde en üste scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-black/10 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-black/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <BellRing className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">Bildirimler</h1>
                  <p className="text-white/90 text-lg">Ödemeler, hatırlatmalar ve önemli güncellemeler</p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  {stats.total || 0} Toplam Bildirim
                </Badge>
                {stats.unread > 0 && <Badge className="bg-red-500 text-white">{stats.unread} Okunmamış</Badge>}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bell className="h-16 w-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Bildirim"
          value={stats.total || 0}
          subtitle="Tüm bildirimler"
          color="blue"
          icon={<Bell />}
        />
        <MetricCard
          title="Okunmamış"
          value={stats.unread || 0}
          subtitle="Yeni bildirimler"
          color="orange"
          icon={<BellRing />}
          change={stats.unread > 0 ? `${stats.unread} yeni` : "Hepsi okundu"}
          changeType={stats.unread > 0 ? "negative" : "positive"}
        />
        <MetricCard
          title="Uyarılar"
          value={stats.warnings || 0}
          subtitle="Önemli hatırlatmalar"
          color="red"
          icon={<AlertTriangle />}
        />
        <MetricCard
          title="Başarılı"
          value={stats.success || 0}
          subtitle="Tamamlanan işlemler"
          color="emerald"
          icon={<CheckCircle />}
        />
      </div>

      {/* Modern Table */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-white">Bildirim Listesi</CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => loadNotifications(true)}
                className="gap-2 bg-transparent dark:bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Yenile
              </Button>

              {stats.unread > 0 && (
                <Button variant="default" onClick={handleMarkAllAsRead} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Tümünü Okundu İşaretle
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap mt-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/60 h-4 w-4 pointer-events-none" />
              <Input
                placeholder="Bildirim ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10 dark:text-white focus-visible:border-emerald-500 focus-visible:shadow-[0_0_0_0.5px_rgb(16,185,129)] transition-all duration-200"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Sadece Okunmamış
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6">
          {paginatedNotifications.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-24 h-24 bg-gray-100 dark:bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-12 w-12 text-gray-400 dark:text-white/60" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">
                {searchTerm || showUnreadOnly
                  ? "Filtre kriterlerine uygun bildirim bulunamadı"
                  : "Henüz bildiriminiz yok"}
              </h3>
              <p className="text-gray-500 dark:text-white/60 mb-6">
                {searchTerm || showUnreadOnly
                  ? "Farklı filtreler deneyebilir veya arama teriminizi değiştirebilirsiniz."
                  : "Yeni bildirimler otomatik olarak oluşturulacak ve burada görünecek."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-black/20 border-b dark:border-white/10">
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tip</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Başlık</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Mesaj</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Zaman</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                      <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-white/70">
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNotifications.map((notification, index) => {
                      // Fall back to "info" styling if notification.type is undefined or not found in typeConfig
                      const typeKey = (notification.type as keyof typeof typeConfig) ?? "info"
                      const config = typeConfig[typeKey] ?? typeConfig.info
                      const Icon = config.icon

                      return (
                        <TableRow
                          key={notification.id}
                          className={`transition-colors duration-150 ease-in-out border-b dark:border-white/10 ${
                            index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                          } ${!notification.is_read ? "bg-blue-50/30 dark:bg-blue-900/20" : ""}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <Badge className={config.badgeClass}>{config.label}</Badge>
                            </div>
                          </TableCell>

                          <TableCell className="font-medium text-gray-900 dark:text-white max-w-48">
                            <div className="truncate" title={notification.title}>
                              {notification.title}
                            </div>
                          </TableCell>

                          <TableCell className="text-gray-600 dark:text-white/70 max-w-64">
                            <div className="truncate" title={notification.message}>
                              {notification.message}
                            </div>
                          </TableCell>

                          <TableCell className="text-gray-500 dark:text-white/60">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: tr,
                                })}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              )}
                              <Badge
                                className={`${!notification.is_read ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-black/10 text-gray-600 dark:text-white/60"} text-xs px-2 py-1`}
                              >
                                {notification.is_read ? "Okundu" : "Yeni"}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20 dark:hover:text-teal-400"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="dark:bg-black/10 dark:border-white/10">
                                {!notification.is_read && (
                                  <DropdownMenuItem
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="dark:text-white dark:hover:bg-white/10"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Okundu İşaretle
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleViewNotification(notification)}
                                  className="dark:text-white dark:hover:bg-white/10"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Gör
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400 dark:hover:bg-white/10"
                                  onClick={() => handleDelete(notification.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <PaginationModern
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredNotifications.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemName="bildirim"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Auto-refresh info */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 dark:border dark:border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Otomatik Bildirimler</h3>
              <p className="text-sm text-gray-600 dark:text-white/70">
                Yaklaşan ödemeleriniz için otomatik olarak bildirimler oluşturulur ve header'da görüntülenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bildirim Detay Sheet */}
      <NotificationSheet
        notification={selectedNotification}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={handleDelete}
      />
    </div>
  )
}
