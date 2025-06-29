"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/metric-card"
import { PaginationModern } from "@/components/ui/pagination-modern"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import {
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createPaymentReminders,
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
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

const ITEMS_PER_PAGE = 10

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    badgeClass:
      "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800",
    label: "Bilgi",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    badgeClass:
      "bg-gradient-to-r from-orange-600 to-red-700 text-white border-transparent hover:from-orange-700 hover:to-red-800",
    label: "Uyarı",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    badgeClass:
      "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800",
    label: "Hata",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    badgeClass:
      "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800",
    label: "Başarılı",
  },
}

export default function BildirimlerPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const loadNotifications = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(user.id),
        getNotificationStats(user.id),
      ])

      setNotifications(notificationsData || [])
      setStats(statsData || {})
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error("Bildirimler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  // Otomatik bildirim oluşturma - sayfa yüklendiğinde çalışır
  const autoCreateNotifications = async () => {
    if (!user?.id) return

    try {
      await createPaymentReminders(user.id)
    } catch (error) {
      console.error("Error auto-creating notifications:", error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
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

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      const deletedNotification = notifications.find((n) => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        unread: deletedNotification?.is_read ? prev.unread : prev.unread - 1,
        read: deletedNotification?.is_read ? prev.read - 1 : prev.read,
      }))
      toast.success("Bildirim silindi")
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
    autoCreateNotifications()
  }, [user?.id])

  // Sayfa değiştiğinde en üste scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-bold text-gray-800">Bildirim Listesi</CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={loadNotifications} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Yenile
              </Button>

              {stats.unread > 0 && (
                <Button variant="default" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Tümünü Okundu İşaretle
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap mt-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              <Input
                placeholder="Bildirim ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border border-gray-200 focus-visible:border-emerald-500 focus-visible:shadow-[0_0_0_0.5px_rgb(16,185,129)] transition-all duration-200"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              size="sm"
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
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm || showUnreadOnly
                  ? "Filtre kriterlerine uygun bildirim bulunamadı"
                  : "Henüz bildiriminiz yok"}
              </h3>
              <p className="text-gray-500 mb-6">
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
                    <TableRow className="bg-white dark:bg-gray-900">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tip</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Başlık</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Mesaj</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Zaman</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Durum</TableHead>
                      <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-gray-300">
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
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out ${
                            index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                          } ${!notification.is_read ? "bg-blue-50/30" : ""}`}
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

                          <TableCell className="text-gray-600 dark:text-gray-300 max-w-64">
                            <div className="truncate" title={notification.message}>
                              {notification.message}
                            </div>
                          </TableCell>

                          <TableCell className="text-gray-500 dark:text-gray-400">
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
                                className={`${!notification.is_read ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"} text-xs px-2 py-1`}
                              >
                                {notification.is_read ? "Okundu" : "Yeni"}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.is_read && (
                                  <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Okundu İşaretle
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Gör
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
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
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Otomatik Bildirimler</h3>
              <p className="text-sm text-gray-600">
                Yaklaşan ödemeleriniz için otomatik olarak bildirimler oluşturulur ve header'da görüntülenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
